import { isMainThread, Worker, parentPort } from 'node:worker_threads'
import { EventEmitter } from 'node:events'

import Router from '@koa/router'

import { mdmc as db } from './database.js'

import { resultWithHistory, makeSearch, search as searchF, wait } from './common.js'

const DIFFICULTIES = [1, 2, 3, 4] as const

export const logEmitter = new EventEmitter()
const log = (msg: string) => logEmitter.emit('rawLog', `mdmc: ${msg}`)
const error = (msg: string) => logEmitter.emit('rawError', `mdmc: ${msg}`)

const rankdb = db.sublevel<string, RankValue[]>('rank', { valueEncoding: 'json' })

const rank = {
  put: ({ id, difficulty, value }: RankCode & { value: RankValue[] }) => rankdb.put(`${id}_${difficulty}`, value),
  get: ({ id, difficulty }: RankCode) => rankdb.get(`${id}_${difficulty}`).catch(() => [] as RankValue[])
}

export const player = db.sublevel<string, PlayerValue>('player', { valueEncoding: 'json' })
const search = db.sublevel<string, string>('search', { valueEncoding: 'json' })

const MUSIC_KEY = 'musics'
const musicsDB = db.sublevel<typeof MUSIC_KEY, MusicResult>('musics', { valueEncoding: 'json' })

const refreshMusics = async () => {
  const musics = (await downloadSongs())
  const list = musics.map(({ sheets, ...rest }) => {
    const difficultiesMap = Object.fromEntries(sheets.map(({ difficulty, map }) => [map - 1, difficulty]))
    const hashMap = Object.fromEntries(sheets.map(({ hash, map }) => [map - 1, hash]))
    const difficulties = Array(4).fill(0).map((_, i) => difficultiesMap[i] || '0') as [string, string, string, string]
    const hashs = Array(4).fill(0).map((_, i) => hashMap[i] || undefined) as [string, string, string, string]
    return {
      ...rest,
      difficulties,
      sheets,
      hashs
    }
  })
  await musicsDB.put(MUSIC_KEY, list)
  log('Reload Musics')
}

const makeList = async () => {
  const musics = await musicsDB.get(MUSIC_KEY)

  return musics
    .flatMap(({ title: name, _id: id, hashs }) => DIFFICULTIES.map((_, i) => ({ name, hash: hashs[i], difficulty: i, id })))
    .filter(({ hash }) => hash)
}

const downloadSongs = () => fetch('https://api.mdmc.moe/v2/charts/ranked').then<MusicAPIResult>(w => w.json())

const downloadCore = async ({ hash }: { hash: string }) => {
  const w = await fetch(`https://api.mdmc.moe/v2/hq/md?bms_id=${hash}&limit=2000`).then<APIResults>(p => p.json())
  return w.result
}

const core = async ({ name, id, difficulty, l, hash }: MusicCore & { l: { i: number }, hash: string }) => {
  const s = `${name} - ${difficulty}`
  const result = await downloadCore({ hash }).catch(() => {
    error(`Skip: ${s} - Failed`)
    return undefined
  })

  const current = await rank.get({ id, difficulty })
  if (result) {
    const value = resultWithHistory({ result, current })

    await rank.put({ id, difficulty, value })
    l.i--
    log(`${s} / ${l.i}`)
    return { id, difficulty, value }
  }
  return { id, difficulty, value: current }
}

const analyze = async (results: (RankCode & { value: RankValue[] })[]) => {
  const batch = await Object.entries(results
    .reduce((r, { id, difficulty, value }) => value
      .reduce((rr, { user: { user_id, ...restUser }, history, play: { score, acc, character_uid, elfin_uid } }, i) => {
        if (!rr[user_id]) {
          rr[user_id] = { user: { user_id, ...restUser }, plays: [] }
        }
        rr[user_id].plays.push({ id, history, score, acc, difficulty, i, character_uid, elfin_uid })
        return rr
      }, r), {} as PlayerR))
    .reduce(async (p, [id, player]) => {
      const b = await p
      return b.put(id, player)
    }, Promise.resolve(player.batch()))
  await player.clear()
  await batch.write()
}

const mal = async () => {
  log('Start!')
  await refreshMusics()
  const list = await makeList()
  const l = { i: list.length }

  const results = await list.map(w => ({ ...w, l })).reduce(async (p, w) => [...await p, await core(w)], Promise.resolve([] as (RankCode & { value: RankValue[] })[]))
  log('Downloaded')

  await analyze(results)
  log('Analyzed')

  await makeSearch({ log, player: player as any, search })
  log('Search Cached')
}

const start = async () => {
  log('hi~')
  await mal().catch(() => error('error, skip'))
  while (true) {
    const currentHour = new Date().getUTCHours()
    const waitTime = (19 - currentHour + 24) % 24 || 24
    log(`WAIT: ${waitTime}h`)
    await wait(waitTime * 60 * 60 * 1000)
    const startTime = Date.now()
    await mal().catch(() => error('error, skip'))
    const endTime = Date.now()
    log(`TAKE ${endTime - startTime}, at ${new Date().toString()}`)
  }
}

export const run = () => {
  if (isMainThread) {
    const worker = new Worker(new URL(import.meta.url))
    worker.on('message', ({ logName, msg }) => logEmitter.emit(logName, msg))
  }
}

if (!isMainThread) {
  logEmitter.on('rawLog', msg => parentPort?.postMessage({ logName: 'rawLog', msg }))
  logEmitter.on('rawError', msg => parentPort?.postMessage({ logName: 'rawError', msg }))
  start()
}

export const router = new Router({
  prefix: '/mdmc'
})

router.get('/musics', async (ctx: any) => {
  const musicsRaw = await musicsDB.get(MUSIC_KEY)
  const musics: Musics = musicsRaw.map(({ _id: id, title: name, artist: author, charter, bpm, difficulties }) => ({ id, name, author, levelDesigner: charter, bpm, difficulty1: difficulties[0], difficulty2: difficulties[1], difficulty3: difficulties[2], difficulty4: difficulties[3] }))
  ctx.body = musics
})

router.get('/player/:id', async ctx => {
  ctx.body = await player.get(ctx.params.id).catch(() => ({ plays: [], key: '', user: { user_id: '404', nickname: 'User not Found' } }))
})

router.get('/rank/:id/:difficulty', async ctx => {
  let result = await rank.get(ctx.params as any)
  if (result) {
    ctx.body = result.map(({ play: { acc, score, character_uid, elfin_uid }, history: { lastRank } = { lastRank: -1 }, user: { nickname, user_id } }) => [acc, score, lastRank, nickname, user_id, character_uid, elfin_uid])
  }
})

router.get('/search/:string', async ctx => {
  ctx.body = await searchF({ search, q: ctx.params.string })
})

type MusicAPI = {
  analytics: {
    likes: string[]
    plays: number
    views: number
    downloads: number
  }
  _id: string
  title: string
  artist: string
  bpm: string
  charter: string
  length: number
  owner_uid: number
  sheets: {
    _id: string
    charter: string
    difficulty: string
    hash: string
    map: 1 | 2 | 3 | 4
  }[]
  ranked: boolean
  searchTags: string[]
  timestamp: string
  __v: number
}

type MusicAPIResult = MusicAPI[]

type MusicResult = (MusicAPI & {
  hashs: [string, string, string, string]
  difficulties: [string, string, string, string]
})[]

type Musics = {
  name: string
  author: string
  bpm: string
  levelDesigner: string
  difficulty1: string
  difficulty2: string
  difficulty3: string
  difficulty4: string
  id: string
}[]

type Play = {
  acc: number
  bms_id: string
  character_uid: number
  combo: number
  elfin_uid: number
  score: number
  user_id: number
  music_uid: string
  music_difficulty: string
  miss: number
  judge: string
  visible: boolean
}

type User = {
  nickname: string
  user_id: number
  discord_id: string
}

type APIResult = {
  play: Play
  user: User
}

type APIResults = {
  code: number
  rank: {
    detail: null
    order: null
  }
  result: APIResult[]
  total: number
  ranked: boolean
  can_earn_mp: boolean
}

type RankCode = {
  difficulty: number
  id: string
}

type MusicCore = RankCode & {
  name: string
}

type PlayerValue = {
  plays: (Pick<Play, 'acc' | 'score' | 'character_uid' | 'elfin_uid'> & RankCode & { history: { lastRank: number }, i: number })[]
  user: User
}

type PlayerR = Record<string, PlayerValue>

type RankValue = Omit<APIResult, 'user'> & {
  history?: {
    lastRank: number
  }
  user: User
}
