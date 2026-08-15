import assert from 'node:assert/strict'
import test from 'node:test'

import { search as commonSearch } from '../api/common.js'
import { parseSearchQuery, TrigramSearchIndex } from '../api/searchIndex.js'

const oracleTerms = query => [
  ...new Set(query
    .toLowerCase()
    .split(' ')
    .filter(Boolean))
]

const oracle = (entries, query) => {
  const terms = oracleTerms(query)
  if (!terms.length) return []
  return entries
    .filter(([, name]) => terms.every(term => name.toLowerCase().includes(term)))
    .map(([id, name]) => [name, id])
}

test('trigram and short-query paths preserve the current search semantics and order', async () => {
  const entries = [
    ['01', 'Alpha Beta'],
    ['02', 'alpha\tbeta'],
    ['03', 'Éclair'],
    ['04', 'e\u0301clair'],
    ['05', 'ＡＢＣ player'],
    ['06', 'İstanbul'],
    ['07', '😀猫 player'],
    ['08', '👨‍👩‍👧‍👦 family'],
    ['09', 'literal % _ \' " \\ . * + ? [ ] ( ) { } ^ $ | /'],
    ['10', 'aaaa repetition'],
    ['11', 'same nickname'],
    ['2', 'same nickname'],
    ['20', ''],
    ['21', 'short and something-long'],
    ['22', 'lone \ud800 surrogate'],
    ['23', 'long x\ud800yz high surrogate'],
    ['24', 'long x\udcffyz low surrogate'],
    ['id-\ud800', 'lone id']
  ]
  const queries = [
    '', ' ', '   ',
    'alpha', 'ALPHA', 'alpha beta', 'alpha  beta', 'alpha alpha', 'alpha\tbeta',
    'é', 'e\u0301', 'ÉCL', 'ＡＢＣ', 'abc', 'İS', 'i\u0307s',
    '😀', '😀猫', '猫 p', '👨‍👩‍👧‍👦',
    '%', '_', '\'', '"', '\\', '.', '*', '+', '?', '[', ']', '(', ')', '{', '}', '^', '$', '|', '/',
    'aaaa', 'aaa rep', 'same', 'nickname', 'same nickname',
    'sh', 'sh something', 'short something-long', 'missing-gram', '\ud800', 'x\ud800yz', 'x\udcffyz', 'lone id'
  ]

  const index = new TrigramSearchIndex({ yieldEvery: 1 })
  assert.equal(index.version, 0)
  assert.equal(index.search('alpha'), undefined)
  assert.deepEqual(index.search(' '), [])
  const stats = await index.rebuild(entries)

  assert.equal(stats.installed, true)
  assert.equal(stats.version, 1)
  assert.equal(stats.rows, entries.length)
  assert.equal(index.ready, true)
  for (const query of queries) {
    assert.deepEqual(parseSearchQuery(query), oracleTerms(query), `parse: ${query}`)
    assert.deepEqual(index.search(query), oracle(entries, query), query)
  }
})

test('a rebuild becomes visible only after the complete snapshot is ready', async () => {
  const index = new TrigramSearchIndex({ yieldEvery: 0 })
  const oldEntries = [['01', 'old snapshot']]
  await index.rebuild(oldEntries)

  let release
  const barrier = new Promise(resolve => { release = resolve })
  let reached
  const halfway = new Promise(resolve => { reached = resolve })

  async function * nextEntries () {
    yield ['01', 'new snapshot']
    reached()
    await barrier
    yield ['02', 'new second row']
  }

  const rebuilding = index.rebuild(nextEntries())
  await halfway
  assert.deepEqual(index.search('snapshot'), oracle(oldEntries, 'snapshot'))

  release()
  const stats = await rebuilding
  assert.equal(stats.installed, true)
  assert.equal(stats.version, 2)
  assert.equal(index.version, 2)
  assert.deepEqual(index.search('new'), [['new snapshot', '01'], ['new second row', '02']])
})

test('a failed rebuild keeps the previous complete snapshot', async () => {
  const index = new TrigramSearchIndex({ yieldEvery: 0 })
  const oldEntries = [['01', 'stable snapshot']]
  await index.rebuild(oldEntries)

  async function * brokenEntries () {
    yield ['01', 'partial replacement']
    throw new Error('fixture failure')
  }

  await assert.rejects(index.rebuild(brokenEntries()), /fixture failure/)
  assert.equal(index.version, 1)
  assert.deepEqual(index.search('stable'), oracle(oldEntries, 'stable'))
  assert.deepEqual(index.search('partial'), [])
})

test('an older slow rebuild cannot overwrite a newer snapshot', async () => {
  const index = new TrigramSearchIndex({ yieldEvery: 0 })
  let release
  const barrier = new Promise(resolve => { release = resolve })
  let reached
  const halfway = new Promise(resolve => { reached = resolve })

  async function * slowEntries () {
    yield ['01', 'stale build']
    reached()
    await barrier
  }

  const slowBuild = index.rebuild(slowEntries())
  await halfway
  const freshStats = await index.rebuild([['02', 'fresh build']])
  release()
  const staleStats = await slowBuild

  assert.equal(freshStats.installed, true)
  assert.equal(staleStats.installed, false)
  assert.equal(freshStats.version, 1)
  assert.equal(staleStats.version, 1)
  assert.equal(index.version, 1)
  assert.deepEqual(index.search('fresh'), [['fresh build', '02']])
  assert.deepEqual(index.search('stale'), [])
})

test('the API search helper scans before warm-up and bypasses LevelDB after warm-up', async () => {
  const entries = [['01', 'Alpha'], ['10', 'Alphabet'], ['2', 'Beta']]
  let scans = 0
  const search = {
    async * iterator () {
      scans++
      yield * entries
    }
  }
  const index = new TrigramSearchIndex({ yieldEvery: 0 })

  assert.deepEqual(await commonSearch({ search, q: 'alpha', index }), oracle(entries, 'alpha'))
  assert.equal(scans, 1)

  await index.rebuild(entries)
  assert.deepEqual(await commonSearch({ search, q: 'alpha', index }), oracle(entries, 'alpha'))
  assert.equal(scans, 1)
})

test('a failed refresh can invalidate stale results and advance the cache generation', async () => {
  const index = new TrigramSearchIndex({ yieldEvery: 0 })
  await index.rebuild([['01', 'stale snapshot']])

  async function * brokenEntries () {
    yield ['02', 'partial replacement']
    throw new Error('refresh failed')
  }

  await assert.rejects(index.rebuild(brokenEntries(), { invalidateOnFailure: true }), /refresh failed/)

  assert.equal(index.ready, false)
  assert.equal(index.version, 2)
  assert.equal(index.search('stale'), undefined)
  assert.deepEqual(index.search(' '), [])
})

test('an older failed refresh cannot invalidate a newer complete snapshot', async () => {
  const index = new TrigramSearchIndex({ yieldEvery: 0 })
  let release
  const barrier = new Promise(resolve => { release = resolve })
  let reached
  const halfway = new Promise(resolve => { reached = resolve })

  async function * staleBrokenEntries () {
    yield ['01', 'stale partial refresh']
    reached()
    await barrier
    throw new Error('stale refresh failed')
  }

  const staleBuild = index.rebuild(staleBrokenEntries(), { invalidateOnFailure: true })
  await halfway
  await index.rebuild([['02', 'new complete snapshot']])
  release()
  await assert.rejects(staleBuild, /stale refresh failed/)

  assert.equal(index.ready, true)
  assert.equal(index.version, 1)
  assert.deepEqual(index.search('new complete'), [['new complete snapshot', '02']])
})
