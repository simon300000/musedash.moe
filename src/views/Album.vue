<template>
<div>
  <music :music="music" v-for="music in musics" :key="music.uid" :hideAlbum="true"></music>
</div>
</template>

<script>
import { mapState, mapMutations } from 'vuex'

import music from '@/components/music.vue'

export default {
  props: ['album', 'only'],
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
    }
  },
  beforeDestroy() {
    this.removeTitle(this)
  },
  methods: mapMutations(['removeTitle', 'updateTitle']),
  computed: {
    ...mapState(['fullAlbums', 'lang']),
    currentAlbum() {
      return this.fullAlbums[this.album]
    },
    title() {
      if (this.$route.path.includes('/tag/')) {
        return undefined
      }
      if (this.currentAlbum) {
        return {
          ...this.currentAlbum,
          ...this.currentAlbum[this.lang]
        }.title
      }
    },
    musics() {
      const result = Object.values(this.currentAlbum?.music || {})
        .map(music => ({ ...music, ...music[this.lang] }))
      if (this.only) {
        return result.filter(({ uid }) => this.only.includes(uid))
      }
      return result
    }
  }
}
</script>
