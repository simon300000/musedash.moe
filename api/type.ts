import { AvailableLocales } from './albumParser.js'

/* eslint camelcase: ["off"] */
export interface MusicLang {
  name: string
  author: string
}

export interface Music extends Record<AvailableLocales, MusicLang> {
  uid: string,
  name: string,
  author: string,
  bpm: number,
  music: string,
  demo: string,
  cover: string,
  noteJson: string,
  scene: string,
  levelDesigner?: string,
  levelDesigner1?: string,
  levelDesigner2?: string,
  levelDesigner3?: string,
  levelDesigner4?: string,
  difficulty1: string,
  difficulty2: string,
  difficulty3: string,
  difficulty4?: string,
  unlockLevel: number
}

export interface MusicData extends Record<AvailableLocales, MusicLang> {
  uid: string,
  name: string,
  author: string,
  cover: string,
  levelDesigner: string[],
  difficulty: string[]
}

export type Musics = MusicData[]

export interface AlbumLang {
  title: string
}

export interface Album extends Record<AvailableLocales, AlbumLang> {
  uid: string,
  title: string,
  needPurchase: boolean,
  price: string,
  jsonName: string,
  prefabsName: string,
  free: boolean
}

export interface AlbumData extends Record<AvailableLocales, AlbumLang> {
  title: string,
  json: string,
  music: Musics
}

export type Albums = AlbumData[]

export interface User {
  user_id: string,
  nickname: string
}

interface APIResult {
  play: {
    acc: number,
    bms_id: number,
    character_uid: string,
    combo: number,
    elfin_uid: string,
    hp: number,
    score: number,
    user_id: string
  },
  user: User
}

export type APIResults = APIResult[]

export interface MusicCore {
  uid: string,
  difficulty: number
}

export interface RankCore extends MusicCore {
  api: string,
  platform: string
}

export interface RankKey {
  uid: string,
  difficulty: number,
  platform: string
}

export interface RankValue extends APIResult {
  history?: {
    lastRank: number
  },
  platform?: string
}

export interface Play {
  score: number,
  acc: number,
  i: number,
  platform: string,
  history: {
    lastRank: number
  },
  difficulty: number,
  uid: string,
  sum: number
}

export interface PlayerValue {
  plays: Play[],
  user: User
}
