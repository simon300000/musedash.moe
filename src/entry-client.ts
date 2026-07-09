import { createApp } from './app'
import { injectResponseTimingRecorder } from './api'
import { loadGtag, gtag } from './gtag'
import { useMainStore } from './stores/main'
import type { ApiTimingLog, Theme } from './types'
import Cookies from 'js-cookie'

import './theme.scss'

const titles: string[] = []
const themes = ['dark', 'light', 'auto'] as const

const changeTitle = (depth: number, part?: string) => {
  titles[depth] = part!
  document.title = titles.filter(Boolean).reverse().join(' - ')
}

const isTheme = (theme?: string | null): theme is Theme =>
  themes.includes(theme as Theme)

const resolveClientTheme = (): Theme => {
  const queryTheme = new URLSearchParams(window.location.search).get('theme')
  if (isTheme(queryTheme)) return queryTheme

  const cookieTheme = Cookies.get('theme')
  if (isTheme(cookieTheme)) return cookieTheme

  return 'dark'
}

const clientTheme = resolveClientTheme()
document.documentElement.setAttribute('data-theme', clientTheme)

const { app, router } = createApp({
  changeTitle,
  lang: Cookies.get('lang') as string | undefined,
  theme: clientTheme
})

const store = useMainStore()

// Hydrate from SSR state
if (window.__INITIAL_STATE__) {
  store.$patch(window.__INITIAL_STATE__ as Record<string, unknown>)
  delete window.__INITIAL_STATE__
}

store.setTheme(clientTheme)
store.setShowApiTiming(localStorage.showApiTiming === 'true')
injectResponseTimingRecorder((log: ApiTimingLog) => {
  store.pushApiTimingLog(log)
})

// Load Google Analytics
loadGtag()

// Router page tracking
router.afterEach((to) => {
  gtag('config', 'G-B2JLBE6TE0', { page_path: to.fullPath })
})

// Wait for router to be ready before mounting
router.isReady().then(() => {
  app.mount('#app')
})
