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

const langs = ['ChineseS', 'ChineseT', 'English', 'Japanese', 'Korean']

app.use(async ctx => {
  const queryLang = langs.includes(ctx.query.lang) ? ctx.query.lang : undefined
  let lang = ctx.cookies.get('lang')
  if (!lang) {
    lang = queryLang || ctx.acceptsLanguages().reverse().reduce((p, l) => {
      if (l.includes('Hant')) {
        return 'ChineseT'
      }
      if (l.includes('CN') || l.includes('zh')) {
        return 'ChineseS'
      }
      if (l.includes('en')) {
        return 'English'
      }
      if (l.includes('JP') || l.includes('ja')) {
        return 'Japanese'
      }
      if (l.includes('KR') || l.includes('ko')) {
        return 'Korean'
      }
      return p
    }, false) || 'English'
    ctx.cookies.set('lang', lang, { httpOnly: false })
  }
  lang = queryLang || lang
  console.log(lang)
  let result = await renderer.renderToString({ url: ctx.url, lang }).catch(e => {
    console.error(e)
    if (e.code) {
      ctx.throw(e.code)
    } else {
      ctx.throw(e.code)
    }
    return undefined
  })
  ctx.type = 'text/html'
  ctx.body = result
})

app.listen(8300)
