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
  bpm: string,
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
  levelDesigner5?: string,
  difficulty1: string,
  difficulty2: string,
  difficulty3: string,
  difficulty4?: string,
  difficulty5?: string,
  unlockLevel: number
}

export interface MusicData extends Record<AvailableLocales, MusicLang> {
  uid: string;
  name: string;
  author: string;
  cover: string;
  levelDesigner: string[];
  difficulty: string[];
  bpm: string;
}

export type Musics = MusicData[]

export interface AlbumLang {
  title: string
}

export interface Album extends Record<AvailableLocales, AlbumLang> {
  uid: string,
  title: string,
  tag: string,
  needPurchase: boolean,
  price: string,
  jsonName: string,
  prefabsName: string,
  free: boolean
}

export interface AlbumData extends Record<AvailableLocales, AlbumLang> {
  title: string,
  json: string,
  tag: string,
  music: Musics
}

export type Albums = AlbumData[]

export interface User {
  user_id: string,
  nickname: string,
  avatar?: string
}

export interface RawAPI {
  result: APIResults,
  total: number
}

export interface APIResult {
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

export type MusicCore = {
  uid: string,
  difficulty: number
}

export interface RankCore extends MusicCore {
  api: string,
  platform: string
}

export type RankKey = {
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
  character_uid: string,
  elfin_uid: string,
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
  user: User,
  key: string
}

export type Job = {
  url: string
  resolve: (value: RawAPI) => void
  reject: (reason: any) => void
}

export type MusicTagList = {
  code: number
  music_tag_list: {
    anchor_pattern: boolean
    created_at: string
    icon_name: string
    music_list: string[]
    object_id: string
    sort_key: number
    tag_name: Record<AvailableLocales, string>
    tag_picture: string
    updated_at: string
  }[]
}

export type TagExport = {
  name: string
  displayName: Record<AvailableLocales, string>
  musicList: {
    json: string
    musics?: string[]
  }[]
}[]
