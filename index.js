const Koa = require('koa')
const app = new Koa()
const path = require('path')
const serve = require('koa-static')

const { createBundleRenderer } = require('vue-server-renderer')
const template = require('fs').readFileSync('index.html', 'utf-8').replace('<div id="app"></div>', '<!--vue-ssr-outlet-->')
const serverBundle = require('./dist/vue-ssr-server-bundle.json')
const clientManifest = require('./dist/vue-ssr-client-manifest.json')
const renderer = createBundleRenderer(serverBundle, {
  runInNewContext: true,
  template,
  clientManifest
})

app.use(serve('dist'))

app.use(async ctx => {
  let result = await renderer.renderToString({ url: ctx.url }).catch(() => '404 找不到')
  ctx.type = 'text/html'
  ctx.body = result
})

app.listen(8300)
