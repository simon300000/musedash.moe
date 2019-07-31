import Vue from 'vue'
import Vuex from 'vuex'
import { getAlbums } from './api'

Vue.use(Vuex)

export const createStore = ({ lang }) => new Vuex.Store({
  state: {
    fullAlbums: [],
    lang
  },
  mutations: {
    setAlbums(state, data) {
      state.fullAlbums = data
    }
  },
  actions: {
    async loadAlbums({ commit }) {
      commit('setAlbums', await getAlbums())
    }
  }
})
