<template>
<div>
  <music :music="music" v-for="music in musics" :key="music.uid"></music>
</div>
</template>

<script>
import { mapState } from 'vuex'

import music from '@/components/music.vue'

export default {
  props: ['album'],
  components: {
    music
  },
  computed: {
    ...mapState(['fullAlbums', 'lang']),
    currentAlbum() {
      return this.fullAlbums[this.album]
    },
    musics() {
      return Object.values(this.currentAlbum?.music || {})
        .map(music => ({ ...music, ...music[this.lang] }))
    }
  }
}
</script>
