import { defineStore } from 'pinia'
import { mdmcGetAlbum, mdmcGetPlayer, mdmcGetRank } from '../api'
import type { MdmcMusic, MdmcRankEntry, MdmcPlayerData } from '../types'
import { useMainStore } from './main'

export const useMdmcStore = defineStore('mdmc', {
  state: () => ({
    album: [] as MdmcMusic[],
    rankCache: {} as Record<string, MdmcRankEntry[]>,
    userCache: {} as Record<string, MdmcPlayerData>
  }),

  getters: {
    songs: ({ album }): Record<string, MdmcMusic> =>
      Object.fromEntries(album.map(({ id, ...rest }) => [id, { ...rest, id }]))
  },

  actions: {
    async loadAlbum(): Promise<void> {
      const main = useMainStore()
      const ceP = main.loadCE()
      const albumP = mdmcGetAlbum()
      await ceP
      this.album = await albumP
    },

    async loadRank({ id, difficulty }: { id: string; difficulty: number }): Promise<void> {
      this.rankCache = { ...this.rankCache, [`${id}_${difficulty}`]: await mdmcGetRank({ id, difficulty }) }
    },

    async loadUser(id: string): Promise<void> {
      this.userCache = { ...this.userCache, [id]: await mdmcGetPlayer(id) }
    }
  }
})
