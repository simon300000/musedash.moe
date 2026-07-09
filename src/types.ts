// ---- Primitives ----
export type Lang = 'ChineseS' | 'ChineseT' | 'English' | 'Japanese' | 'Korean'
export type Theme = 'dark' | 'light' | 'auto'

// ---- Music ----
export interface MusicLang {
  name: string
  author: string
}

export interface MusicData {
  uid: string
  name: string
  author: string
  cover: string
  bpm: string
  levelDesigner: string[]
  difficulty: string[]
  ChineseS: MusicLang
  ChineseT: MusicLang
  English: MusicLang
  Japanese: MusicLang
  Korean: MusicLang
}

// ---- Album ----
export interface AlbumLang {
  title: string
}

export interface AlbumData {
  json: string
  title: string
  music: Record<string, MusicData>
  ChineseS: AlbumLang
  ChineseT: AlbumLang
  English: AlbumLang
  Japanese: AlbumLang
  Korean: AlbumLang
  [lang: string]: unknown
}

// ---- Tag ----
export interface TagData {
  name: string
  displayName: Record<Lang, string>
  musicList: Array<{ json: string; musics: string[] }>
}

// ---- CE (Characters & Elfins) ----
export interface CEData {
  c: Record<Lang, string[]>
  e: Record<Lang, string[]>
}

// ---- Rank ----
export interface RankEntry {
  acc: number
  score: number
  lastRank: number
  nickname: string
  id: string
  platform: string
  character: string
  elfin: string
  url: string
  index: number
  uid: string
  difficulty: number
}

// ---- Player ----
export interface PlayerPlay {
  uid: string
  difficulty: number
  platform: string
  score: number
  acc: number
  i: number
  sum: number
  character_uid: string
  elfin_uid: string
}

export interface PlayerUser {
  user_id: string
  nickname: string
  avatar?: string
}

export interface PlayerData {
  user: PlayerUser
  plays: PlayerPlay[]
  rl?: number
  lastUpdate?: number
  diffHistoryNumber?: number
}

// ---- DiffDiff ----
export interface DiffDiffEntry {
  uid: string
  difficulty: number
  level: string
  absolute: number
  relative: number
}

export interface DiffDiffMusicEntry {
  level: string
  absolute: number
  relative: number
}

// ---- MDMC ----
export interface MdmcMusic {
  id: string
  name: string
  author: string
  levelDesigner: string
  difficulty1: string
  difficulty2: string
  difficulty3: string
  difficulty4: string
}

export interface MdmcRankEntry {
  acc: number
  score: number
  lastRank: number
  nickname: string
  id: string
  character: string
  elfin: string
  url: string
  index: number
}

export interface MdmcPlayerData {
  user: PlayerUser
  plays: PlayerPlay[]
}

// ---- API Timing ----
export interface ApiTimingLog {
  method: string
  path: string
  duration: number
  cacheStatus: string
  at: number
}

// ---- SSR ----
export interface SSRContext {
  url: string
  lang?: Lang
  theme?: Theme
}

// ---- History ----
export interface DiffHistoryEntry {
  time: number
  diff: number
}

// ---- Dispatch ----
export interface DispatchResponse {
  url?: string
}

// ---- Gallery of played music (used in PlayerCore) ----
export interface PlayerPlayDisplay extends PlayerPlay {
  src: string
  name: string
  author: string
  lv: string
  link: string
  sumLink?: string
  elfin: string
  character: string
}

// ---- Window augmentation ----
declare global {
  interface Window {
    __INITIAL_STATE__?: Record<string, unknown>
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[][]
  }
}
