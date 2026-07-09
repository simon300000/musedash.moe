import type { App as VueApp } from 'vue'
import type { Router } from 'vue-router'
import { createApp as createVueApp, h } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { createRouter } from './router'
import { useMainStore } from './stores/main'
import type { Lang, Theme } from './types'

interface CreateAppOptions {
  lang?: Lang
  changeTitle: (depth: number, part?: string) => void
  theme?: Theme
}

interface CreateAppResult {
  app: VueApp
  router: Router
  store: ReturnType<typeof useMainStore>
}

export const createApp = ({ lang = 'ChineseS', changeTitle, theme = 'dark' }: CreateAppOptions): CreateAppResult => {
  const app = createVueApp({
    render: () => h(App)
  })

  const pinia = createPinia()
  app.use(pinia)

  const router = createRouter()
  app.use(router)

  const store = useMainStore()
  store.lang = lang
  store.theme = theme
  store._changeTitle = changeTitle

  return { app, router, store }
}
