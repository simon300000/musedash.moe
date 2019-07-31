import Vue from 'vue'
import Vuex from 'vuex'
import { getAlbums } from './api'
import { set as cookieSet } from 'js-cookie'

Vue.use(Vuex)

export const createStore = ({ lang }) => new Vuex.Store({
  state: {
    fullAlbums: {},
    lang
  },
  mutations: {
    setAlbums(state, data) {
      state.fullAlbums = data
    },
    setLang(state, data) {
      cookieSet('lang', data)
      state.lang = data
    }
  },
  actions: {
    async loadAlbums({ commit }) {
      commit('setAlbums', await getAlbums())
    }
  }
})
