const Koa = require('koa')
const app = new Koa()
const serve = require('koa-static')

const { createBundleRenderer } = require('vue-server-renderer')
const template = require('fs').readFileSync('index.html', 'utf-8').replace('<div id="app"></div>', '<!--vue-ssr-outlet-->')
const serverBundle = require('./dist/vue-ssr-server-bundle.json')
const clientManifest = require('./dist/vue-ssr-client-manifest.json')
const renderer = createBundleRenderer(serverBundle, {
  runInNewContext: 'once',
  template,
  clientManifest
})

app.use(serve('dist'))

app.use(async ctx => {
  let lang = ctx.cookies.get('lang')
  if (!lang) {
    lang = 'ChineseS'
    ctx.cookies.set('lang', lang)
  }
  let result = await renderer.renderToString({ url: ctx.url, lang }).catch(() => '404 找不到')
  ctx.type = 'text/html'
  ctx.body = result
})

app.listen(8300)
