import Vue from 'vue'
import { get as cookieGet } from 'js-cookie'
import VueGtag from "vue-gtag"

import { createApp } from './app'
import './registerServiceWorker'

let titles = []

const changeTitle = (depth, part) => {
  titles[depth] = part
  document.title = titles.filter(Boolean).reverse().join(' - ')
}

const { app, store, router } = createApp({ changeTitle, lang: cookieGet('lang'), theme: cookieGet('theme') })

if (window.__INITIAL_STATE__) {
  store.replaceState(window.__INITIAL_STATE__)
}

Vue.use(VueGtag, {
  config: { id: "UA-123973162-5" }
}, router)

app.$mount('#app')
