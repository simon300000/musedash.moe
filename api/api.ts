/* eslint camelcase: ["off"] */
import Koa from 'koa'
import Router from '@koa/router'
import LRU from 'lru-cache'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { promises as fs } from 'fs'

import { Albums } from './type.js'
import { rank, player, search } from './database.js'
import { albums, AvailableLocales, availableLocales } from './albumParser.js'

import { search as searchF } from './common.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const { readFile } = fs

const cache = new LRU({
  maxAge: 1000 * 5,
  max: 100,
  updateAgeOnGet: true
})

export const app = new Koa()

app.use(async (ctx, next) => {
  ctx.set('Access-Control-Allow-Origin', 'https://musedash.moe')

  let hit = cache.get(ctx.url)
  if (hit) {
    ctx.body = hit
  } else {
    await next()
    cache.set(ctx.url, ctx.body)
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

router.get('/player/:id', async ctx => {
  ctx.body = await player.get(ctx.params.id).catch(() => undefined)
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

app.use(router.routes())

app.listen(8301)
