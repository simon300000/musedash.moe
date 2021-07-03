<template>
<div>
  <music :music="music" v-for="music in musics" :key="music.uid" :hideAlbum="true"></music>
</div>
</template>

<script>
import { mapState, mapMutations } from 'vuex'

import music from '@/components/music.vue'

export default {
  props: ['album'],
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
      return {
        ...this.currentAlbum,
        ...this.currentAlbum[this.lang]
      }.title
    },
    musics() {
      return Object.values(this.currentAlbum?.music || {})
        .map(music => ({ ...music, ...music[this.lang] }))
    }
  }
}
</script>
