import Vue from 'vue'
import Vuex from 'vuex'
import { getAlbums, getRank, getPlayer, getCE, mdmcGetAlbum, mdmcGetPlayer, mdmcGetRank } from './api'
import { set as cookieSet } from 'js-cookie'

Vue.use(Vuex)

export const createStore = ({ lang, changeTitle, theme }) => {
  const countParent = instance => instance.$parent ? 1 + countParent(instance.$parent) : 0
  let owners = []

  const updateTitle = (instance, part) => {
    const depth = countParent(instance)
    owners[depth] = instance
    changeTitle(depth, part)
  }
  const removeTitle = instance => {
    const depth = countParent(instance)
    if (!owners[depth] || owners[depth] === instance) {
      changeTitle(depth)
    }
  }

  return new Vuex.Store({
    state: {
      fullAlbums: {},
      rankCache: {},
      userCache: {},
      ce: { c: {}, e: {} },
      lang,
      theme
    },
    getters: {
      albumsArray: ({ fullAlbums }) => Object.values(fullAlbums),
      allMusics: ({ fullAlbums }) => {
        return Object.assign({}, ...Object.values(fullAlbums).map(({ music }) => music))
      },
      musicAlbum: ({ fullAlbums }) => Object.fromEntries(Object.entries(fullAlbums).flatMap(([id, { music }]) => Object.keys(music).map(k => [k, id]))),
      characters: ({ ce, lang: l }) => ce.c[l] || [],
      elfins: ({ ce, lang: l }) => ce.e[l] || []
    },
    mutations: {
      setAlbums(state, data) {
        state.fullAlbums = data
      },
      setCE(state, ce) {
        state.ce = ce
      },
      setRank(state, { uid, difficulty, platform, rank }) {
        state.rankCache = { ...state.rankCache, [`${uid}_${platform}_${difficulty}`]: rank }
      },
      setUser(state, { id, data }) {
        state.userCache = { ...state.userCache, [id]: data }
      },
      setLang(state, data) {
        cookieSet('lang', data)
        state.lang = data
      },
      setTheme(state, data) {
        cookieSet('theme', data)
        state.theme = data
      },
      updateTitle(_state, [instance, part]) {
        updateTitle(instance, part)
      },
      removeTitle(_state, instance) {
        removeTitle(instance)
      }
    },
    actions: {
      async loadAlbums({ commit }) {
        const ceP = getCE()
        commit('setAlbums', await getAlbums())
        commit('setCE', await ceP)
      },
      async loadRank({ commit }, { uid, difficulty, platform }) {
        commit('setRank', { uid, difficulty, platform, rank: await getRank({ uid, difficulty, platform }) })
      },
      async loadUser({ commit }, id) {
        commit('setUser', { id, data: await getPlayer(id) })
      }
    },
    modules: {
      mdmc: {
        namespaced: true,
        state: {
          album: [],
          rankCache: {},
          userCache: {}
        },
        mutations: {
          setAlbum(state, data) {
            state.album = data
          },
          setRank(state, { id, difficulty, rank }) {
            state.rankCache = { ...state.rankCache, [`${id}_${difficulty}`]: rank }
          },
          setUser(state, { id, data }) {
            state.userCache = { ...state.userCache, [id]: data }
          }
        },
        actions: {
          async loadAlbum({ commit }) {
            commit('setAlbum', await mdmcGetAlbum())
          },
          async loadRank({ commit }, { id, difficulty, }) {
            commit('setRank', { id, difficulty, rank: await mdmcGetRank({ id, difficulty }) })
          },
          async loadUser({ commit }, id) {
            commit('setUser', { id, data: await mdmcGetPlayer(id) })
          }
        }
      }
    }
  })
}
