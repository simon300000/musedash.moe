/* eslint camelcase: ["off"] */
import Koa = require('koa')
import Router = require('koa-router')
import LRU = require('lru-cache')

const cache = new LRU({
  maxAge: 1000 * 5,
  max: 100
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

export default ({ albums, rank, player }) => {
  let albumsObject = {}
  albums.forEach(album => {
    albumsObject[album.json] = { ...album, music: {} }
    album.music.forEach(music => {
      albumsObject[album.json].music[music.uid] = music
    })
  })
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
    ctx.body = await player.get(ctx.params.id)
  })

  router.get('/search/:string', async ctx => {
    const search = ctx.params.string
      .split(' ')
      .filter(Boolean)
    ctx.body = await new Promise(resolve => {
      let result = []
      const stream = player.createValueStream()
      stream.on('data', ({ user: { nickname, user_id } }) => {
        if (search.filter(word => nickname.includes(word)).length === search.length) {
          result.push([nickname, user_id])
        }
      })
      stream.on('close', () => resolve(result))
    })
  })

  app.use(router.routes())

  app.listen(8301)
}
