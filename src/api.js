import Vue from 'vue'
import axios from 'axios'

const url = process.env.NODE_ENV === 'development' ? '/api/' : new Vue().$isServer ? 'http://0.0.0.0:8301/' : 'https://api.musedash.moe/'

const get = async api => (await axios(`${url}${api}`)).data

export const getAlbums = () => get('albums')
export const getRank = async ({ uid, difficulty, platform }) => (await get(`rank/${uid}/${difficulty}/${platform}`)).map(([acc, score, lastRank, nickname, id, platform, character, elfin], index) => ({ acc, score, lastRank, nickname, id, platform, character, elfin, url: `/player/${id}`, index }))
export const getPlayer = id => get(`player/${id}`)
export const searchPlayer = search => get(`search/${search}`)
export const getLog = () => get(`log`)
export const getCE = () => get(`ce`)

const getMDMC = api => get(`mdmc/${api}`)

export const mdmcGetAlbum = () => getMDMC('musics')
export const mdmcGetRank = async ({ id: i, difficulty }) => (await getMDMC(`rank/${i}/${difficulty}`)).map(([acc, score, lastRank, nickname, id, character, elfin], index) => ({ acc, score, lastRank, nickname, id, character, elfin, url: `/mdmc/player/${id}`, index }))
export const mdmcGetPlayer = id => getMDMC(`player/${id}`)
export const mdmcSearchPlayer = search => getMDMC(`search/${search}`)
