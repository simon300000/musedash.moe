import Vue from 'vue'

const url = process.env.NODE_ENV === 'development' ? '/api/' : new Vue().$isServer ? 'http://0.0.0.0:8301/' : 'https://api.musedash.moe/'
const RESPONSE_TIME_HEADER = 'X-Response-Time'
const CACHE_STATUS_HEADER = 'X-Cache-Status'

let f = undefined
let responseTimingRecorder = undefined

export const injectFetch = w => {
  f = w
}

export const injectResponseTimingRecorder = recorder => {
  responseTimingRecorder = recorder
}

const recordResponseTiming = (response, method, api) => {
  if (!responseTimingRecorder || typeof window === 'undefined' || method === 'OPTIONS') {
    return
  }
  const rawDuration = response.headers.get(RESPONSE_TIME_HEADER)
  const duration = Number.parseInt(rawDuration, 10)
  if (Number.isNaN(duration)) {
    return
  }
  responseTimingRecorder({
    method,
    path: `/${api}`,
    duration,
    cacheStatus: response.headers.get(CACHE_STATUS_HEADER) || 'UNKNOWN',
    at: Date.now()
  })
}

const request = async (api, options = {}) => {
  const method = options.method || 'GET'
  const response = await (f || fetch)(`${url}${api}`, options)
  recordResponseTiming(response, method, api)
  return response
}

const get = async api => (await request(api)).json()
const getText = async api => (await request(api)).text()

const post = async (api, obj) => (await request(api, {
  method: 'POST',
  body: JSON.stringify(obj),
  headers: {
    'Content-Type': 'application/json'
  }
})).json()

export const getAlbums = () => get('albums')
export const getTag = () => get('tag')
export const getRank = async ({ uid, difficulty, platform }) => (await get(`rank/${uid}/${difficulty}/${platform}`)).map(([acc, score, lastRank, nickname, id, platform, character, elfin], index) => ({ acc, score, lastRank, nickname, id, platform, character, elfin, url: `/player/${id}`, index, uid, difficulty }))
export const getRankRaw = async ({ uid, difficulty, platform, id }) => get(`rank/${uid}/${difficulty}/${platform}/${id}`)
export const getPlayer = id => get(`player/${id}`)
export const searchPlayer = search => get(`search/${search}`)
export const getLog = () => getText('log')
export const getCE = () => get('ce')
export const getDiffDiff = async () => (await get('diffdiff')).map(([uid, difficulty, level, absolute, relative]) => ({ uid, difficulty, level, absolute, relative }))
export const getDiffHistory = ({ id, start, length }) => get(`player/diffHistory/${id}?start=${start}&length=${length}`)

export const getDiffDiffMusic = ({ uid, difficulty }) => get(`diffDiffMusic/${uid}/${difficulty}`)
export const getRankUpdateTime = ({ uid, difficulty, platform }) => get(`rankUpdateTime/${uid}/${difficulty}/${platform}`)

export const refreshRank = ({ uid, difficulty, platform }) => post('refreshRank', { uid, difficulty, platform })

const getMDMC = api => get(`mdmc/${api}`)

export const mdmcGetAlbum = () => getMDMC('musics')
export const mdmcGetRank = async ({ id: i, difficulty }) => (await getMDMC(`rank/${i}/${difficulty}`)).map(([acc, score, lastRank, nickname, id, character, elfin], index) => ({ acc, score, lastRank, nickname, id, character, elfin, url: `/mdmc/player/${id}`, index }))
export const mdmcGetPlayer = id => getMDMC(`player/${id}`)
export const mdmcSearchPlayer = search => getMDMC(`search/${search}`)

export const dispatch = () => post('dispatch', {})
export const receipt = (url, data) => post('receipt', { url, data })
