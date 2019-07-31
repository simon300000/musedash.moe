import Vue from 'vue'
import Vuex from 'vuex'
import { getAlbums } from './api'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    fullAlbums: []
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
