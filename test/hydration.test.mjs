import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { chromium } from 'playwright-core'

const root = fileURLToPath(new URL('../', import.meta.url))
const origin = 'http://127.0.0.1:8300'

async function startServer(t) {
  await new Promise((resolve, reject) => {
    const probe = createServer()
    probe.once('error', reject)
    probe.listen(8300, '127.0.0.1', () => probe.close(resolve))
  })
  const child = spawn(process.execPath, ['server.js'], {
    cwd: root, env: { ...process.env, NODE_ENV: 'development' },
    stdio: ['ignore', 'pipe', 'pipe']
  })
  let output = ''
  let startupError
  const collect = chunk => { output = (output + chunk.toString()).slice(-16000) }
  child.stdout.on('data', collect)
  child.stderr.on('data', collect)
  child.once('error', error => { startupError = error })
  const closed = new Promise(resolve => child.once('close', resolve))
  t.after(async () => {
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGTERM')
    const force = setTimeout(() => child.kill('SIGKILL'), 5000)
    force.unref()
    try { await closed } finally { clearTimeout(force) }
  })
  for (let n = 0; n < 600; n++) {
    if (startupError || child.exitCode !== null || child.signalCode !== null) {
      throw new Error('SSR server exited: ' + String(startupError || '') + '\n' + output)
    }
    if (output.includes('Server running at')) {
      try {
        const response = await fetch(origin + '/player', { signal: AbortSignal.timeout(5000) })
        const html = await response.text()
        assert.equal(response.status, 200, output)
        assert.ok(html.includes('window.__INITIAL_STATE__') && html.includes('Search Player'),
          'Server did not return the SSR search page:\n' + output)
        return
      } catch (error) {
        if (error instanceof assert.AssertionError) throw error
      }
    }
    await delay(100)
  }
  throw new Error('SSR server start timed out:\n' + output)
}

async function visit(browser, t, { path = '/player', cookieTheme, corrupt = false } = {}) {
  const context = await browser.newContext({
    viewport: { width: 800, height: 900 },
    locale: 'en-US',
    serviceWorkers: 'block'
  })
  t.after(() => context.close())
  await context.addCookies([
    { name: 'lang', value: 'English', url: origin },
    ...(cookieTheme ? [{ name: 'theme', value: cookieTheme, url: origin }] : [])
  ])
  await context.addInitScript(() => {
    localStorage.noSpider = 'true'
    localStorage.showApiTiming = 'false'
  })
  const page = await context.newPage()
  page.setDefaultTimeout(15000)
  const mismatches = []
  const errors = []
  const apiRequests = []
  page.on('console', message => {
    if (['warning', 'error'].includes(message.type()) && /hydrat|mismatch/i.test(message.text())) {
      mismatches.push(message.text())
    }
  })
  page.on('pageerror', error => errors.push(error.message))
  let release
  const gate = new Promise(resolve => { release = resolve })
  await page.route('**/*', async route => {
    const request = route.request()
    const url = new URL(request.url())
    if (url.origin === origin) {
      // Pause only module downloads, not HTML parsing, so we can capture SSR DOM.
      if (request.resourceType() === 'script') await gate
      if (!page.isClosed()) await route.continue()
      return
    }
    if (url.origin === 'https://api.musedash.moe') {
      apiRequests.push(url.pathname)
      const headers = { 'access-control-allow-origin': '*' }
      if (url.pathname === '/search/Hydration') {
        return route.fulfill({
          status: 200, headers, contentType: 'application/json',
          body: JSON.stringify([['Hydration player', 'hydration-player']])
        })
      }
      if (url.pathname === '/log') {
        return route.fulfill({
          status: 200, headers, contentType: 'text/plain', body: 'Hydration fixture log'
        })
      }
      errors.push('Unexpected API request: ' + request.method() + ' ' + url.pathname)
      return route.fulfill({ status: 500, headers, body: 'Unexpected test API request' })
    }
    return route.fulfill({ status: 200, contentType: 'text/javascript', body: '' })
  })

  let initialState
  try {
    const response = await page.goto(origin + path, { waitUntil: 'commit' })
    assert.equal(response.status(), 200)
    await page.waitForFunction(() =>
      window.__INITIAL_STATE__ && document.querySelector('input[placeholder="Search Player"]'))
    initialState = await page.evaluate(corrupt => {
      const container = document.getElementById('app')
      if (corrupt) {
        container.querySelector('input[placeholder="Search Player"]').replaceWith(
          document.createElement('textarea'))
      }
      const nodes = []
      const walker = document.createTreeWalker(container, NodeFilter.SHOW_ALL)
      while (walker.nextNode()) nodes.push(walker.currentNode)
      const records = []
      const observer = new MutationObserver(batch => records.push(...batch))
      observer.observe(container, { subtree: true, childList: true, characterData: true })
      window.__hydrationProbe = {
        container, nodes, records, observer, nav: container.querySelector('nav')
      }
      return window.__INITIAL_STATE__
    }, corrupt)
    release()
    await page.waitForFunction(() => Boolean(document.getElementById('app').__vue_app__))
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(
      () => requestAnimationFrame(resolve))))
  } finally {
    release()
  }

  const dom = await page.evaluate(() => {
    const probe = window.__hydrationProbe
    probe.records.push(...probe.observer.takeRecords())
    probe.observer.disconnect()
    const after = []
    const walker = document.createTreeWalker(probe.container, NodeFilter.SHOW_ALL)
    while (walker.nextNode()) after.push(walker.currentNode)
    return {
      before: probe.nodes.length,
      after: after.length,
      retained: probe.nodes.filter((node, index) => node === after[index]).length,
      mutations: probe.records.length,
      stateConsumed: !('__INITIAL_STATE__' in window)
    }
  })
  return { page, context, initialState, dom, mismatches, errors, apiRequests }
}

function assertHydrated(result) {
  const { dom, mismatches, errors } = result
  assert.ok(dom.before > 30, 'Expected a real server-rendered page, not an empty shell')
  assert.equal(dom.after, dom.before, 'Hydration changed the number of SSR nodes')
  assert.equal(dom.retained, dom.before, 'Client mount replaced server DOM')
  assert.equal(dom.mutations, 0, 'Hydration rebuilt or rewrote server DOM')
  assert.equal(dom.stateConsumed, true, 'Client did not consume initial Pinia state')
  assert.deepEqual(mismatches, [], 'Unexpected hydration diagnostic')
  assert.deepEqual(errors, [], 'Unexpected browser error')
}

test('SSR hydration preserves DOM identity and enables real application events', { timeout: 240000 }, async t => {
  await startServer(t)
  const browser = await chromium.launch({
    executablePath: process.env.HYDRATION_BROWSER_EXECUTABLE
  })
  t.after(() => browser.close())

  const cases = [
    { name: 'default dark', theme: 'dark' },
    { name: 'light theme cookie', cookieTheme: 'light', theme: 'light' },
    { name: 'auto theme cookie', cookieTheme: 'auto', theme: 'auto' },
    {
      name: 'URL settings and restored Japanese SSR Pinia state',
      path: '/search?lang=Japanese&theme=light',
      cookieTheme: 'dark', theme: 'light', lang: 'Japanese'
    },
    { name: 'auto URL override', path: '/player?theme=auto', cookieTheme: 'light', theme: 'auto' },
    { name: 'invalid URL falls back to cookie', path: '/player?theme=invalid', cookieTheme: 'light', theme: 'light' }
  ]
  for (const scenario of cases) {
    await t.test(scenario.name, { timeout: 25000 }, async t => {
      const result = await visit(browser, t, scenario)
      assertHydrated(result)
      assert.equal(result.initialState.theme, scenario.theme)
      assert.equal(result.initialState.lang, scenario.lang || 'English')
      assert.equal(await result.page.locator('html').getAttribute('data-theme'), scenario.theme)
      assert.equal((await result.page.locator('.navbar-link').textContent()).trim(),
        scenario.lang === 'Japanese' ? '日本語' : 'English')
      assert.match(await result.page.title(), /^Search - /)
    })
  }

  await t.test('menu, theme, language, router and search events after hydration', { timeout: 40000 }, async t => {
    const result = await visit(browser, t)
    assertHydrated(result)
    const { page, context, apiRequests, errors, mismatches } = result
    const initialUrl = page.url()
    await page.locator('.navbar-burger').click()
    await page.waitForFunction(() => document.querySelector('.navbar-menu').classList.contains('is-active'))
    for (const theme of ['light', 'auto', 'dark']) {
      await page.locator('.navbar-end > a.navbar-item').click()
      await page.waitForFunction(theme => document.documentElement.dataset.theme === theme, theme)
      assert.equal((await context.cookies()).find(cookie => cookie.name === 'theme').value, theme)
      assert.equal(page.url(), initialUrl, 'Theme action unexpectedly navigated')
    }
    await page.locator('a.navbar-item[href="/about"]').click()
    await page.waitForURL(origin + '/about')
    await page.waitForFunction(() => document.querySelector('.log')?.textContent === 'Hydration fixture log')
    assert.match(await page.title(), /^About - /)
    await page.locator('.navbar-burger').click()
    await page.locator('a.navbar-item[href="?lang=ChineseS"]').click()
    await page.waitForFunction(() => document.querySelector('.navbar-link').textContent.trim() === '简体中文')
    await page.waitForURL(url => url.searchParams.get('lang') === 'ChineseS')
    assert.equal((await context.cookies()).find(cookie => cookie.name === 'lang').value, 'ChineseS')
    await page.locator('.navbar-burger').click()
    await page.locator('a.navbar-item[href="/player"]').click()
    await page.waitForURL(origin + '/player')
    await page.waitForFunction(() => document.title.startsWith('Search - '))
    await page.evaluate(() => {
      window.__searchInput = document.querySelector('input[placeholder="Search Player"]')
    })
    await page.locator('input[placeholder="Search Player"]').fill('Hydration')
    await page.locator('input[type="submit"]').click()
    await page.waitForFunction(() => document.querySelector('p.help')?.textContent === 'Result: 1')
    assert.equal(await page.locator('a.level .title').textContent(), 'Hydration player')
    assert.equal(apiRequests.filter(path => path === '/search/Hydration').length, 1)
    assert.equal(await page.evaluate(() => window.__searchInput ===
      document.querySelector('input[placeholder="Search Player"]')), true)
    assert.equal(await page.evaluate(() => window.__hydrationProbe.nav === document.querySelector('nav')), true)
    assert.deepEqual(errors, [])
    assert.deepEqual(mismatches, [])
  })

  await t.test('a deliberately corrupted SSR input reports and repairs mismatch', { timeout: 25000 }, async t => {
    const result = await visit(browser, t, { corrupt: true })
    assert.ok(result.mismatches.length > 0, 'Hydration mismatch diagnostic was not observed')
    assert.ok(result.dom.retained < result.dom.before, 'Corrupted SSR node was not repaired')
    assert.ok(result.dom.mutations > 0, 'Corrupted SSR node was not replaced')
    assert.equal(await result.page.locator('input[placeholder="Search Player"]').count(), 1)
    assert.deepEqual(result.errors, [])
  })
})
