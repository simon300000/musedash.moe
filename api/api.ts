/* eslint camelcase: ["off"] */
import Koa from 'koa'
import Router from '@koa/router'
import koaBody from 'koa-body'

import LRU from 'lru-cache'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { readFile } from 'fs/promises'

import { Albums, RankKey, PlayerValue } from './type.js'
import { rank, player, search, getDiffDiff, playerDiff, rankUpdateTime, playerUpdateTime, getTag, getRaw, getPlayerDiffHistoryNumber, getPlayerDiffHistory, getPlayerNumer, getPlayerDiffRank } from './database.js'
import { albums, AvailableLocales, availableLocales } from './albumParser.js'

import { search as searchF } from './common.js'

import { joinJob } from './spider.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const PLAYER_NOT_FOUND: PlayerValue = { plays: [{ uid: '35-0', history: { lastRank: NaN }, difficulty: 0, score: NaN, acc: NaN, i: NaN, sum: NaN, platform: '?', character_uid: '2', elfin_uid: '' }], key: '', user: { user_id: '404', nickname: 'User not Found' } }

const cache = new LRU({
  maxAge: 1000 * 5,
  max: 100
})

export const app = new Koa()

app.use(async (ctx, next) => {
  ctx.set('Access-Control-Allow-Origin', 'https://musedash.moe')
  ctx.set('Access-Control-Allow-Headers', 'Content-Type')
  ctx.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
  if (ctx.method === 'OPTIONS') {
    ctx.body = ''
  } else {
    await next()
  }
})

app.use(async (ctx, next) => {
  if (ctx.method === 'GET') {
    const hit = cache.get(ctx.url)
    if (hit) {
      ctx.body = hit
    } else {
      await next()
      cache.set(ctx.url, ctx.body)
    }
  } else {
    await next()
  }
})

const logs: string[] = []

const logInsert = (s: string) => {
  logs.unshift(s)
  if (logs.length > 2048) {
    logs.pop()
  }
}

export const log = (s: string) => {
  console.log(s)
  logInsert(s)
}

export const error = (s: string) => {
  console.error(s)
  logInsert(s)
}

const parseAlbums = (a: Albums) => Object.fromEntries(a.map(album => [album.json, { ...album, music: Object.fromEntries(album.music.map(music => [music.uid, music])) }]))

let albumsObject: ReturnType<typeof parseAlbums>

let ce: { c: Record<AvailableLocales, string[]>, e: Record<AvailableLocales, string[]> }

const parseCe = async () => {
  const c = Object.fromEntries(await Promise.all(availableLocales.map(async l => [l, JSON.parse(String(await readFile(join(__dirname, 'extra', `character_${l}.json`)))).map(({ cosName }) => cosName)])))
  const e = Object.fromEntries(await Promise.all(availableLocales.map(async l => [l, JSON.parse(String(await readFile(join(__dirname, 'extra', `elfin_${l}.json`)))).map(({ name }) => name)])))
  ce = { c, e }
}

export const reloadAlbums = async () => {
  albumsObject = parseAlbums(await albums())
  await parseCe()
  log('Reload Albums')
}

reloadAlbums()

const router = new Router()

router.get('/albums', ctx => {
  ctx.body = albumsObject
})

router.get('/tag', async ctx => {
  ctx.body = await getTag()
})

router.get('/rank/:uid/:difficulty/:platform', async ctx => {
  let result = await rank.get(ctx.params as any)
  if (result) {
    if (ctx.params.platform === 'all') {
      ctx.body = result.map(({ play: { acc, score, character_uid, elfin_uid }, history: { lastRank } = { lastRank: -1 }, user: { nickname, user_id }, platform }) => [acc, score, lastRank, nickname, user_id, platform, character_uid, elfin_uid])
    } else {
      ctx.body = result.map(({ play: { acc, score, character_uid, elfin_uid }, history: { lastRank } = { lastRank: -1 }, user: { nickname, user_id } }) => [acc, score, lastRank, nickname, user_id, undefined, character_uid, elfin_uid])
    }
  }
})

router.get('/rank/:uid/:difficulty/:platform/:id', async ctx => {
  const { uid, difficulty, platform, id } = ctx.params
  ctx.body = await getRaw({ uid, difficulty: Number(difficulty), platform }, id)
})

router.get('/rankUpdateTime/:uid/:difficulty/:platform', async ctx => {
  ctx.body = await rankUpdateTime.get(ctx.params as any as RankKey)
})

router.get('/diffDiffMusic/:uid/:difficulty', async ctx => {
  const { uid, difficulty } = ctx.params
  // TODO: use getDIffDiffMusic
  const diffdiff = await getDiffDiff()
  const [{ relative = NaN, absolute = NaN } = {}] = diffdiff.filter(({ uid: u, difficulty: d }) => uid === u && Number(difficulty) === d)
  ctx.body = { relative, absolute }
})

router.post('/refreshRank', koaBody(), async ctx => {
  const { uid, difficulty, platform } = ctx.request.body
  await joinJob({ uid, difficulty, platform })
  ctx.body = { hi: 'you found me!' }
})

router.get('/player/:id', async ctx => {
  const { id } = ctx.params
  const [
    p,
    rl,
    diffHistoryNumber,
    lastUpdate
  ] = await Promise.all([
    player.get(id).catch(() => PLAYER_NOT_FOUND),
    playerDiff.get(id).catch<string>(() => 'NaN'),
    getPlayerDiffHistoryNumber(id),
    playerUpdateTime.get(ctx.params.id)
  ])

  ctx.body = { lastUpdate, rl, diffHistoryNumber, ...p }
})

router.get('/player/diffHistory/:id', async ctx => {
  const { id } = ctx.params
  const { start, length } = ctx.query
  ctx.body = await getPlayerDiffHistory(id, Number(start), Number(length))
})

router.get('/search', async ctx => {
  ctx.body = []
})

router.get('/search/:string', async ctx => {
  ctx.body = await searchF({ search, q: ctx.params.string })
})

router.get('/log', ctx => {
  ctx.body = logs.join('\n')
})

router.get('/ce', ctx => {
  ctx.body = ce
})

router.get('/diffdiff', async ctx => {
  const diffDiff = await getDiffDiff()
  ctx.body = diffDiff.map(({ uid, difficulty, level, absolute, relative }) => [uid, difficulty, level, absolute, relative])
})

router.get('/uptime', ctx => {
  ctx.body = process.uptime()
})

router.get('/playerNumber', async ctx => {
  ctx.body = await getPlayerNumer()
})

router.get('/playerDiffRank', async ctx => {
  ctx.body = await getPlayerDiffRank()
})

app.use(router.routes())

app.listen(8301)
