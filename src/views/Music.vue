<template>
<div>
  <progress class="progress is-small" max="100" v-if="!albumsArray.length"></progress>
  <template v-if="albumsArray.length">
    <music :music="currentMusic" :platform="platform" :level="difficulty"></music>
    <router-view></router-view>
  </template>
</div>
</template>

<script>
import { mapGetters, mapActions, mapState, mapMutations } from 'vuex'

import music from '@/components/music.vue'

export default {
  props: ['uid', 'platform', 'difficulty'],
  components: {
    music
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
    uid: {
      immediate: true,
      handler(uid) {
        this.setBlackWhite(uid === '42-0')
      }
    }
  },
  beforeDestroy() {
    this.removeTitle(this)
    this.setBlackWhite(false)
  },
  computed: {
    ...mapGetters(['allMusics', 'albumsArray']),
    ...mapState(['lang']),
    currentMusic() {
      const all = this.allMusics
      const current = all[this.uid]
      if (current) {
        return { ...current, ...current[this.lang] }
      }
      return {}
    },
    title() {
      return this.currentMusic.name
    }
  },
  async serverPrefetch() {
    await this.loadAlbums()
    this.updateTitle([this, this.title])
  },
  mounted() {
    this.loadAlbums()
  },
  methods: {
    ...mapActions(['loadAlbums']),
    ...mapMutations(['removeTitle', 'updateTitle', 'setBlackWhite'])
  }
}
</script>
