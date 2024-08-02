<template>
<div>
  <progress class="progress is-small" max="100" v-if="!currentPlayer || !this.albumsArray.length"></progress>
  <core v-else :plays="plays" :current="currentPlayer" :id="currentPlayer.user.user_id"></core>
</div>
</template>

<script>
import { mapActions, mapState, mapGetters, mapMutations } from 'vuex'

import Core from '@/components/PlayerCore.vue'

import { loadCover } from '@/coverLoader'

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
    ...mapState(['userCache', 'lang']),
    ...mapGetters(['albumsArray', 'allMusics', 'elfins', 'characters']),
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
        .map(({ uid, difficulty, platform, character_uid, elfin_uid, ...rest }) => {
          const music = { ...this.allMusics[uid], ...(this.allMusics[uid] || {})[this.lang] }
          const src = loadCover(music.cover)
          const { name = uid, author } = music
          const lv = (music.difficulty || {})[difficulty]
          const link = `/music/${uid}/${difficulty}/${platform}`
          const sumLink = `/music/${uid}/${difficulty}`
          const elfin = this.elfins[elfin_uid]
          const character = this.characters[character_uid]
          return { ...rest, src, name, author, lv, difficulty, platform, link, sumLink, elfin, character, uid }
        })
    }
  },
  async serverPrefetch() {
    await this.loadAlbums()
    await this.loadUser(this.id)
    this.updateTitle([this, this.title])
  },
  mounted() {
    this.loadAlbums()
  },
  methods: {
    ...mapActions(['loadAlbums', 'loadUser']),
    ...mapMutations(['updateTitle', 'removeTitle'])
  }
}
</script>
