<template>
<div>
  <progress class="progress is-small" max="100" v-if="!currentPlayer || !this.album.length"></progress>
  <core v-else :plays="plays" :current="currentPlayer" :id="currentPlayer.user.user_id"  :mdmc="true"></core>
</div>
</template>

<script>
import { mapGetters, mapMutations, createNamespacedHelpers } from 'vuex'

import Core from '@/components/PlayerCore.vue'

const { mapActions, mapState, mapGetters: mapNamespacedGetters } = createNamespacedHelpers('mdmc')

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
          this.updateTitle([this, title])
        }
      }
    },
    id: {
      immediate: true,
      handler() {
        if (!this.currentPlayer) {
          this.loadUser(this.id)
        }
      }
    }
  },
  beforeDestroy() {
    this.removeTitle(this)
  },
  computed: {
    ...mapGetters(['elfins', 'characters']),
    ...mapState(['album', 'userCache']),
    ...mapNamespacedGetters(['songs']),
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
    await this.loadAlbum()
    await this.loadUser(this.id)
    this.updateTitle([this, this.title])
  },
  async mounted() {
    if (!this.album.length) {
      await this.loadAlbum()
    }
  },
  methods: {
    ...mapActions(['loadAlbum', 'loadUser']),
    ...mapMutations(['updateTitle', 'removeTitle'])
  }
}
</script>
