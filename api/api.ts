/* eslint camelcase: ["off"] */
import Koa from 'koa'
import Router from '@koa/router'
import koaBody from 'koa-body'

import LRU from 'lru-cache'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { readFile } from 'fs/promises'

import { Albums, PlayerValue, RankKey } from './type.js'
import { rank, player, search, getDiffDiff, playerDiff, rankUpdateTime, playerUpdateTime, getTag } from './database.js'
import { albums, AvailableLocales, availableLocales } from './albumParser.js'

import { search as searchF } from './common.js'

import { joinJob } from './spider.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

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

router.get('/rankUpdateTime/:uid/:difficulty/:platform', async ctx => {
  ctx.body = await rankUpdateTime.get(ctx.params as any as RankKey)
})

router.post('/refreshRank', koaBody(), async ctx => {
  const { uid, difficulty, platform } = ctx.request.body
  await joinJob({ uid, difficulty, platform })
  ctx.body = { hi: 'you found me!' }
})

router.get('/player/:id', async ctx => {
  const { id } = ctx.params
  const playerP = player.get(id).catch<any>(() => ({ plays: [{ uid: '35-0', history: {}, difficulty: 0 }], key: '', user: { user_id: '404', nickname: 'User not Found' } }))
  const playerRLP = playerDiff.get(id).catch<string>(() => 'NaN')
  const p = await playerP as PlayerValue & { rl: number | string, lastUpdate: number }
  const playerRL = await playerRLP
  if (p && playerRL) {
    p.rl = playerRL
  }
  p.lastUpdate = await playerUpdateTime.get(ctx.params.id)
  ctx.body = p
})

router.get('/search', async ctx => {
  ctx.body = []
})

router.get('/search/:string', async ctx => {
  ctx.body = await searchF({ search, q: ctx.params.string, player })
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

app.use(router.routes())

app.listen(8301)
