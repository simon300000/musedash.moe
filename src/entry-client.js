import Vue from 'vue'
import Cookies from 'js-cookie'
import VueGtag from "vue-gtag"

import { createApp } from './app'
import { injectResponseTimingRecorder } from './api'
import './registerServiceWorker'

let titles = []

const changeTitle = (depth, part) => {
  titles[depth] = part
  document.title = titles.filter(Boolean).reverse().join(' - ')
}

const { app, store, router } = createApp({ changeTitle, lang: Cookies.get('lang'), theme: Cookies.get('theme') })

if (window.__INITIAL_STATE__) {
  store.replaceState(window.__INITIAL_STATE__)
}

store.commit('setShowApiTiming', localStorage.showApiTiming === 'true')
injectResponseTimingRecorder(log => {
  store.commit('pushApiTimingLog', log)
})

Vue.use(VueGtag, {
  config: { id: "G-B2JLBE6TE0" }
}, router)

app.$mount('#app')
