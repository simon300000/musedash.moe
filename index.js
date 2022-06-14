import Koa from 'koa'
import serve from 'koa-static'
import mount from 'koa-mount'

import vsr from 'vue-server-renderer'
import { readFile } from 'fs/promises'

const { createBundleRenderer } = vsr

const serverBundle = JSON.parse(await readFile('./dist/vue-ssr-server-bundle.json'))
const clientManifest = JSON.parse(await readFile('./dist/vue-ssr-client-manifest.json'))

clientManifest.async = clientManifest.async.filter(file => !file.includes('.noinject.'))

const app = new Koa()

const template = (await readFile('index.html', 'utf-8')).replace('<div id="app"></div>', '<!--vue-ssr-outlet-->')

const renderer = createBundleRenderer(serverBundle, {
  runInNewContext: 'once',
  template,
  clientManifest
})

app.use(mount('/covers', serve('./src/covers')))
app.use(serve('dist'))

const langs = ['ChineseS', 'ChineseT', 'English', 'Japanese', 'Korean']
const themes = ['dark', 'light']

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

  const queryTheme = themes.includes(ctx.query.theme) ? ctx.query.theme : undefined
  let theme = ctx.cookies.get('theme')
  if (!theme) {
    theme = queryTheme || themes[0]
    ctx.cookies.set('theme', theme, { httpOnly: false })
  }
  theme = queryTheme || theme

  let result = await renderer.renderToString({ url: ctx.url, lang, theme, fetch }).catch(e => {
    console.error(e, { url: ctx.url })
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
