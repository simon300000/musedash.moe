/* eslint camelcase: ["off"] */
import { Albums } from './type'

import Koa from 'koa'
import Router from '@koa/router'
import LRU from 'lru-cache'

const cache = new LRU({
  maxAge: 1000 * 5,
  max: 100,
  updateAgeOnGet: true
})

const app = new Koa()

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

export default ({ albums, rank, player, search }: { albums: Albums, rank, player, search }) => {
  const albumsObject = Object.fromEntries(albums.map(album => [album.json, { ...album, music: Object.fromEntries(album.music.map(music => [music.uid, music])) }]))
  const router = new Router()

  router.get('/albums', ctx => {
    ctx.body = albumsObject
  })

  router.get('/rank/:uid/:difficulty/:platform', async ctx => {
    let result = await rank.get(ctx.params)
    if (result) {
      if (ctx.params.platform === 'all') {
        result = result.map(({ play: { acc, score }, history: { lastRank } = { lastRank: -1 }, user: { nickname, user_id }, platform }) => [acc, score, lastRank, nickname, user_id, platform])
      } else {
        result = result.map(({ play: { acc, score }, history: { lastRank } = { lastRank: -1 }, user: { nickname, user_id } }) => [acc, score, lastRank, nickname, user_id])
      }
    }
    ctx.body = result
  })

  router.get('/player/:id', async ctx => {
    ctx.body = await player.get(ctx.params.id).catch(() => undefined)
  })

  router.get('/search/:string', async ctx => {
    const query = [...new Set(ctx.params.string
      .toLowerCase()
      .split(' ')
      .filter(Boolean))]
    if (query.length) {
      const profiles: Promise<any>[] = await new Promise(resolve => {
        let result = []
        const stream = search.createReadStream()
        stream.on('data', ({ key: user_id, value: nickname }) => {
          if (!query.find(word => !nickname.includes(word))) {
            result.push(player.get(user_id)
              .then(({ user: { nickname, user_id } }) => [nickname, user_id])
              .catch(() => undefined))
          }
        })
        stream.on('close', () => resolve(result))
      })
      const result = await Promise.all(profiles)
      ctx.body = result.filter(Boolean)
    } else {
      ctx.body = []
    }
  })

  app.use(router.routes())

  app.listen(8301)
}
