import Vue from 'vue'
import App from './App.vue'
import { createRouter } from './router'
import { createStore } from './store'
import { sync } from 'vuex-router-sync'

Vue.config.productionTip = false

export const createApp = ({ lang = 'ChineseS', changeTitle, theme = 'dark' }) => {
  const router = createRouter()
  const store = createStore({ lang, changeTitle, theme })

  sync(store, router)

  const app = new Vue({
    router,
    store,
    render: h => h(App)
  })
  return { app, router, store }
}
