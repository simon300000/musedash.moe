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
import { useMainStore } from '../stores/main'

import music from '../components/music.vue'

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
          useMainStore().updateTitle(this, title)
        }
      }
    },
    uid: {
      immediate: true,
      handler(uid) {
        useMainStore().setBlackWhite(uid === '42-0')
      }
    }
  },
  beforeUnmount() {
    useMainStore().removeTitle(this)
    useMainStore().setBlackWhite(false)
  },
  computed: {
    allMusics() { return useMainStore().allMusics },
    albumsArray() { return useMainStore().albumsArray },
    lang() { return useMainStore().lang },
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
    await useMainStore().loadAlbums()
    useMainStore().updateTitle(this, this.title)
  },
  mounted() {
    useMainStore().loadAlbums()
  }
}
</script>
