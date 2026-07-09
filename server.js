import Koa from 'koa'
import serve from 'koa-static'
import mount from 'koa-mount'
import { readFile } from 'fs/promises'
import { createServer as createViteServer } from 'vite'
const isProduction = process.env.NODE_ENV === 'production'
const PORT = 8300

const langs = ['ChineseS', 'ChineseT', 'English', 'Japanese', 'Korean']
const themes = ['dark', 'light', 'auto']

async function start() {
  const app = new Koa()

  // Cache-Control middleware (shared between dev & prod)
  app.use(async (ctx, next) => {
    try {
      await next()
      const { url, status } = ctx
      if (status !== 200) return
      if (url.includes('/covers/')) {
        ctx.set('Cache-Control', 'public, max-age=604800')
      } else if (url.match(/\.\w{8,}\./)) {
        // Vite hashed assets (name-hash.ext), immutable
        ctx.set('Cache-Control', 'public, max-age=31536000, immutable')
      } else {
        ctx.set('Cache-Control', 'max-age=14400')
      }
    } catch (e) {
      if (e.status === 404) {
        ctx.set('Cache-Control', 'no-cache')
      }
    }
  })

  // Covers static mount (shared)
  app.use(mount('/covers', serve('./src/covers')))

  if (!isProduction) {
    // ======= DEV MODE: Vite middleware + SSR =======
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom'
    })

    // Bridge connect-style middleware to Koa
    const viteMiddleware = (ctx, next) => {
      return new Promise((resolve, reject) => {
        vite.middlewares(ctx.req, ctx.res, err => {
          if (err) reject(err)
          else resolve(next())
        })
      })
    }

    app.use(viteMiddleware)

    // API proxy: forward /api/* to the API server (same as old vue.config.cjs proxy)
    app.use(async (ctx, next) => {
      if (ctx.path.startsWith('/api/')) {
        const target = `http://0.0.0.0:8301${ctx.path.replace('/api', '')}${ctx.search}`
        const resp = await fetch(target, {
          method: ctx.method,
          headers: { 'Content-Type': 'application/json' },
          body: ctx.method !== 'GET' && ctx.method !== 'HEAD' ? ctx.request.rawBody : undefined
        })
        ctx.status = resp.status
        ctx.set('Content-Type', resp.headers.get('Content-Type') || 'application/json')
        ctx.body = await resp.text()
        return
      }
      await next()
    })

    app.use(async ctx => {
      // Resolve lang & theme (same logic as production)
      const queryLang = langs.includes(ctx.query.lang) ? ctx.query.lang : undefined
      let lang = ctx.cookies.get('lang')
      if (!lang) {
        lang = queryLang || ctx.acceptsLanguages().reverse().reduce((p, l) => {
          if (l.includes('Hant')) return 'ChineseT'
          if (l.includes('CN') || l.includes('zh')) return 'ChineseS'
          if (l.includes('en')) return 'English'
          if (l.includes('JP') || l.includes('ja')) return 'Japanese'
          if (l.includes('KR') || l.includes('ko')) return 'Korean'
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

      if (ctx.url === '/index.html') {
        ctx.url = '/'
      }

      // Skip SSR for static assets and Vite-internal paths
      if (ctx.url.startsWith('/api/') || ctx.url.startsWith('/@') ||
        ctx.url.includes('/node_modules/') ||
        /\.(js|css|png|webp|ico|svg|json|woff2?|ttf|map)$/.test(ctx.url)) {
        return
      }

      try {
        let html = await readFile('./index.html', 'utf-8')
        html = await vite.transformIndexHtml(ctx.url, html)

        const { default: render } = await vite.ssrLoadModule('/src/entry-server.ts')

        const ssrContext = {
          url: ctx.url,
          lang,
          theme
        }

        const { html: appHtml, state, title } = await render(ssrContext)

        html = html.replace('<!--ssr-title-->', title)
        html = html.replace('<div id="app"></div>', `<div id="app">${appHtml}</div>`)
        html = html.replace('</head>', `<script>window.__INITIAL_STATE__=${JSON.stringify(state)}</script></head>`)

        ctx.type = 'text/html'
        ctx.body = html
      } catch (e) {
        vite.ssrFixStacktrace(e)
        console.error(e, { url: ctx.url })
        if (e.code) {
          ctx.throw(e.code)
        }
        ctx.type = 'text/html'
        ctx.body = 'Internal Server Error'
      }
    })
  } else {
    // ======= PRODUCTION MODE: Static files + SSR =======
    // Serve static assets but NOT index.html (SSR handles that)
    app.use(serve('dist/client', { index: false }))

    const template = await readFile('./dist/client/index.html', 'utf-8')
    const { default: render } = await import('./dist/server/entry-server.js')

    app.use(async ctx => {
      const queryLang = langs.includes(ctx.query.lang) ? ctx.query.lang : undefined
      let lang = ctx.cookies.get('lang')
      if (!lang) {
        lang = queryLang || ctx.acceptsLanguages().reverse().reduce((p, l) => {
          if (l.includes('Hant')) return 'ChineseT'
          if (l.includes('CN') || l.includes('zh')) return 'ChineseS'
          if (l.includes('en')) return 'English'
          if (l.includes('JP') || l.includes('ja')) return 'Japanese'
          if (l.includes('KR') || l.includes('ko')) return 'Korean'
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

      if (ctx.url === '/index.html') {
        ctx.url = '/'
      }

      // Only handle non-API, non-static GET requests
      if (ctx.url.startsWith('/api/') || ctx.url.includes('.') && !ctx.url.endsWith('/')) {
        return
      }

      try {
        const { html: appHtml, state, title } = await render({ url: ctx.url, lang, theme })

        let html = template.replace('<!--ssr-title-->', title)
        html = html.replace('<div id="app"></div>', `<div id="app">${appHtml}</div>`)
        html = html.replace('</head>', `<script>window.__INITIAL_STATE__=${JSON.stringify(state)}</script></head>`)

        ctx.type = 'text/html'
        ctx.body = html
      } catch (e) {
        console.error(e, { url: ctx.url })
        if (e.code) {
          ctx.throw(e.code)
        }
        ctx.type = 'text/html'
        ctx.body = 'Internal Server Error'
      }
    })
  }

  app.listen(PORT)
  console.log(`Server running at http://localhost:${PORT} (${isProduction ? 'production' : 'development'})`)
}

start()
