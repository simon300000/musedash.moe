import Koa = require('koa')
import Router = require('koa-router')
import LRU = require('lru-cache')

const cache = new LRU({
  maxAge: 1000 * 5,
  max: 100
})

const app = new Koa()

app.use(async (ctx, next) => {
  let hit = cache.get(ctx.url)
  if (hit) {
    ctx.body = hit
  } else {
    await next()
    cache.set(ctx.url, ctx.body)
  }
})

export default ({ albums }) => {
  const router = new Router()

  router.get('/albums', ctx => {
    ctx.body = albums
  })

  app.use(router.routes())

  app.listen(8301)
}
