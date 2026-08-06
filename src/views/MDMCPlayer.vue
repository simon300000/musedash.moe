<template>
<div>
  <progress class="progress is-small" max="100" v-if="!currentPlayer || !album.length"></progress>
  <core v-else :plays="plays" :current="currentPlayer" :id="currentPlayer.user.user_id"  :mdmc="true"></core>
</div>
</template>

<script>
import { useMainStore } from '../stores/main'
import { useMdmcStore } from '../stores/mdmc'

import Core from '../components/PlayerCore.vue'

export default {
  props: ['id'],
  components: {
    Core
  },
  watch: {
    title: {
      immediate: true,
      handler(title) {
        if (title) {
          useMainStore().updateTitle(this, title)
        }
      }
    },
    id: {
      immediate: true,
      handler() {
        if (!this.currentPlayer) {
          useMdmcStore().loadUser(this.id)
        }
      }
    }
  },
  beforeUnmount() {
    useMainStore().removeTitle(this)
  },
  computed: {
    elfins() { return useMainStore().elfins },
    characters() { return useMainStore().characters },
    album() { return useMdmcStore().album },
    userCache() { return useMdmcStore().userCache },
    songs() { return useMdmcStore().songs },
    currentPlayer() {
      return this.userCache[this.id]
    },
    title() {
      return this.currentPlayer && this.currentPlayer.user.nickname
    },
    plays() {
      return [...this.currentPlayer.plays]
        .sort(({ score: a }, { score: b }) => b - a)
        .sort(({ i: a }, { i: b }) => a - b)
        .map(({ id, difficulty, character_uid, elfin_uid, ...rest }) => {
          const music = this.songs[id]
          const src = `https://cdn.mdmc.moe/charts/${id}/cover.png`
          const { name, author } = music
          const lv = music[`difficulty${difficulty + 1}`]
          const link = `/mdmc/chart/${id}/${difficulty}`
          const elfin = this.elfins[elfin_uid]
          const character = this.characters[character_uid]
          return { ...rest, src, name, author, lv, difficulty, link, elfin, character }
        })
    }
  },
  async serverPrefetch() {
    const mdmc = useMdmcStore()
    await mdmc.loadAlbum()
    await mdmc.loadUser(this.id)
    useMainStore().updateTitle(this, this.title)
  },
  async mounted() {
    const mdmc = useMdmcStore()
    if (!mdmc.album.length) {
      await mdmc.loadAlbum()
    }
  }
}
</script>
