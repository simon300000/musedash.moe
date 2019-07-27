import Koa = require('koa')
import Router = require('koa-router')

const app = new Koa()

export default ({ albums }) => {
  const router = new Router()

  router.get('/albums', ctx => {
    ctx.body = albums
  })

  app.use(router.routes())

  app.listen(8301)
}
