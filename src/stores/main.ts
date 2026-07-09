import { defineStore } from 'pinia'
import type {
  Lang,
  Theme,
  AlbumData,
  TagData,
  CEData,
  RankEntry,
  PlayerData,
  DiffDiffEntry,
  DiffDiffMusicEntry,
  ApiTimingLog,
} from '../types'
import {
  getAlbums,
  getTag,
  getRank,
  getRankUpdateTime,
  refreshRank,
  getPlayer,
  getCE,
  getDiffDiff,
  getDiffDiffMusic,
} from '../api'
import Cookies from 'js-cookie'
import { loadCover } from '../coverLoader'

const countParent = (instance: any): number =>
  instance.$parent ? 1 + countParent(instance.$parent) : 0

interface MainState {
  albumsLoaded: number
  fullAlbums: Record<string, AlbumData>
  tag: TagData[]
  rankCache: Record<string, RankEntry[]>
  diffDiffMusic: Record<string, DiffDiffMusicEntry>
  rankUpdateTimeCache: Record<string, number>
  userCache: Record<string, PlayerData>
  diffDiff: DiffDiffEntry[]
  ce: CEData
  blackWhite: boolean
  showApiTiming: boolean
  apiTimingLogs: ApiTimingLog[]
  lang: Lang
  theme: Theme
  _titleOwners?: any[]
  _changeTitle?: (depth: number, part?: string) => void
}

interface DiffAppearance {
  uid: string
  absolute: number
  relative: number
  difficulties: Array<{ level: string; link?: string }>
  albumName: string
  albumLink: string
  name: string
  author: string
  src: string
}

export const useMainStore = defineStore('main', {
  state: (): MainState => ({
    albumsLoaded: 0,
    fullAlbums: {} as Record<string, AlbumData>,
    tag: [],
    rankCache: {},
    diffDiffMusic: {},
    rankUpdateTimeCache: {},
    userCache: {},
    diffDiff: [],
    ce: { c: {} as Record<Lang, string[]>, e: {} as Record<Lang, string[]> },
    blackWhite: false,
    showApiTiming: false,
    apiTimingLogs: [],
    lang: 'ChineseS',
    theme: 'dark',
  }),

  getters: {
    albumsArray({ fullAlbums }: MainState): AlbumData[] {
      return Object.values(fullAlbums)
    },

    allMusics({ fullAlbums }: MainState): Record<string, any> {
      return Object.fromEntries(
        Object.values(fullAlbums).flatMap(({ music }) => Object.entries(music)),
      )
    },

    tagMap({ tag }: MainState): Record<string, TagData['musicList']> {
      return Object.fromEntries(tag.map(({ name, musicList }) => [name, musicList]))
    },

    musicAlbum({ fullAlbums }: MainState): Record<string, string> {
      return Object.fromEntries(
        Object.entries(fullAlbums).flatMap(([id, { music }]) =>
          Object.keys(music).map(k => [k, id]),
        ),
      )
    },

    characters({ ce, lang: l }: MainState): string[] {
      return ce.c[l] || []
    },

    elfins({ ce, lang: l }: MainState): string[] {
      return ce.e[l] || []
    },

    diffDiffMap({ diffDiff }: MainState): Record<string, Array<{ level: string; absolute: number; relative: number }>> {
      return diffDiff.reduce(
        (
          result: Record<string, Array<{ level: string; absolute: number; relative: number }>>,
          { uid, difficulty, level, absolute, relative },
        ) => {
          if (!result[uid]) {
            result[uid] = []
          }
          result[uid][difficulty] = { level, absolute, relative }
          return result
        },
        {},
      )
    },

    diffDiffList(state: MainState): DiffAppearance[] {
      const { diffDiff, fullAlbums, lang: l } = state
      const musicAlbum: Record<string, string> = Object.fromEntries(
        Object.entries(fullAlbums).flatMap(([id, { music }]) =>
          Object.keys(music).map(k => [k, id]),
        ),
      )
      const allMusics: Record<string, any> = Object.fromEntries(
        Object.values(fullAlbums).flatMap(({ music }) => Object.entries(music)),
      )
      return diffDiff.map(
        ({ uid, difficulty, level, absolute, relative }): DiffAppearance => {
          const difficulties = Array(4).fill({ level: '0' })
          difficulties[difficulty] = { level, link: `/music/${uid}/${difficulty}` }

          const album = musicAlbum[uid]
          const albumName = fullAlbums[album][l].title
          const albumLink = `/albums/${album}`

          const { name, author, cover } = allMusics[uid]
          const src = loadCover(cover)
          return {
            uid,
            absolute: Math.round(absolute * 100) / 100,
            relative: Math.round(relative * 100) / 100,
            difficulties,
            albumName,
            albumLink,
            name,
            author,
            src,
          }
        },
      )
    },
  },

  actions: {
    // ---- Title management ----
    updateTitle(instance: any, part: string): void {
      const depth = countParent(instance)
      if (!this._titleOwners) this._titleOwners = []
      if (!this._changeTitle) return
      this._titleOwners[depth] = instance
      this._changeTitle(depth, part)
    },

    removeTitle(instance: any): void {
      if (!this._titleOwners) this._titleOwners = []
      if (!this._changeTitle) return
      const depth = countParent(instance)
      if (!this._titleOwners[depth] || this._titleOwners[depth] === instance) {
        this._changeTitle(depth)
      }
    },

    // ---- Data loading ----
    async loadAlbums(): Promise<void> {
      const albumsArray = Object.values(this.fullAlbums)
      const albumLifeDay = (Date.now() - this.albumsLoaded) / 1000 / 60 / 60 / 24
      if (!albumsArray.length || albumLifeDay > 0.5) {
        const ceP = this.loadCE()
        const albumsP = getAlbums()
        const tagP = getTag()
        await ceP
        this.fullAlbums = await albumsP
        this.tag = await tagP
        this.albumsLoaded = Date.now()
      }
    },

    async loadCE(): Promise<void> {
      if (!Object.keys(this.ce.c).length) {
        this.ce = await getCE()
      }
    },

    async loadDiffDiffMusic({
      uid,
      difficulty,
    }: {
      uid: string
      difficulty: number
    }): Promise<void> {
      this.diffDiffMusic = {
        ...this.diffDiffMusic,
        [`${uid}_${difficulty}`]: await getDiffDiffMusic({
          uid,
          difficulty,
        }),
      }
    },

    async loadRank({
      uid,
      difficulty,
      platform,
    }: {
      uid: string
      difficulty: number
      platform: string
    }): Promise<void> {
      const defer: Promise<void>[] = []
      if (!this.diffDiffMusic[`${uid}_${difficulty}`]) {
        defer.push(this.loadDiffDiffMusic({ uid, difficulty }))
      }
      this.rankCache = {
        ...this.rankCache,
        [`${uid}_${platform}_${difficulty}`]: await getRank({
          uid,
          difficulty,
          platform,
        }),
      }
      this.rankUpdateTimeCache = {
        ...this.rankUpdateTimeCache,
        [`${uid}_${platform}_${difficulty}`]: await getRankUpdateTime({
          uid,
          difficulty,
          platform,
        }),
      }
      await Promise.all(defer)
    },

    async updateRank({
      uid,
      difficulty,
      platform,
    }: {
      uid: string
      difficulty: number
      platform: string
    }): Promise<void> {
      this.rankUpdateTimeCache = {
        ...this.rankUpdateTimeCache,
        [`${uid}_${platform}_${difficulty}`]: 0,
      }
      await refreshRank({ uid, difficulty, platform })
      await this.loadRank({ uid, difficulty, platform })
    },

    async loadUser(id: string): Promise<void> {
      this.userCache = {
        ...this.userCache,
        [id]: await getPlayer(id),
      }
    },

    async loadDiffDiff(): Promise<void> {
      this.diffDiff = await getDiffDiff()
    },

    // ---- Settings ----
    setLang(data: Lang): void {
      Cookies.set('lang', data)
      this.lang = data
    },

    setTheme(data: Theme): void {
      Cookies.set('theme', data)
      this.theme = data
    },

    setBlackWhite(data: boolean): void {
      this.blackWhite = data
    },

    setShowApiTiming(data: boolean): void {
      this.showApiTiming = data
    },

    pushApiTimingLog(log: ApiTimingLog): void {
      this.apiTimingLogs = [log, ...this.apiTimingLogs].slice(0, 10)
    },
  },
})
