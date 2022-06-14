import Vue from 'vue'

const url = process.env.NODE_ENV === 'development' ? '/api/' : new Vue().$isServer ? 'http://0.0.0.0:8301/' : 'https://api.musedash.moe/'

let f = undefined
export const injectFetch = w => {
  f = w
}

const get = async api => (await (f || fetch)(`${url}${api}`)).json()
const getText = async api => (await (f || fetch)(`${url}${api}`)).text()

const post = async (api, obj) => (await (f || fetch)(`${url}${api}`, {
  method: 'POST',
  body: JSON.stringify(obj),
  headers: {
    'Content-Type': 'application/json'
  }
})).json()

export const getAlbums = () => get('albums')
export const getTag = () => get('tag')
export const getRank = async ({ uid, difficulty, platform }) => (await get(`rank/${uid}/${difficulty}/${platform}`)).map(([acc, score, lastRank, nickname, id, platform, character, elfin], index) => ({ acc, score, lastRank, nickname, id, platform, character, elfin, url: `/player/${id}`, index }))
export const getPlayer = id => get(`player/${id}`)
export const searchPlayer = search => get(`search/${search}`)
export const getLog = () => getText('log')
export const getCE = () => get('ce')
export const getDiffDiff = async () => (await get('diffdiff')).map(([uid, difficulty, level, absolute, relative]) => ({ uid, difficulty, level, absolute, relative }))

export const getRankUpdateTime = ({ uid, difficulty, platform }) => get(`rankUpdateTime/${uid}/${difficulty}/${platform}`)

export const refreshRank = ({ uid, difficulty, platform }) => post('refreshRank', { uid, difficulty, platform })

const getMDMC = api => get(`mdmc/${api}`)

export const mdmcGetAlbum = () => getMDMC('musics')
export const mdmcGetRank = async ({ id: i, difficulty }) => (await getMDMC(`rank/${i}/${difficulty}`)).map(([acc, score, lastRank, nickname, id, character, elfin], index) => ({ acc, score, lastRank, nickname, id, character, elfin, url: `/mdmc/player/${id}`, index }))
export const mdmcGetPlayer = id => getMDMC(`player/${id}`)
export const mdmcSearchPlayer = search => getMDMC(`search/${search}`)
