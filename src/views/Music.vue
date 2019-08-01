<template>
<div>
  <progress class="progress is-small" max="100" v-if="!albumsArray.length"></progress>
  <template v-if="albumsArray.length">
    <music :music="currentMusic" :platform="platform"></music>
    <router-view></router-view>
  </template>
</div>
</template>

<script>
import { mapGetters, mapActions, mapState } from 'vuex'

import music from '@/components/music.vue'

export default {
  props: ['uid', 'platform'],
  components: {
    music
  },
  computed: {
    ...mapGetters(['allMusics', 'albumsArray']),
    ...mapState(['lang']),
    currentMusic() {
      return { ...this.allMusics[this.uid], ...this.allMusics[this.uid][this.lang] }
    }
  },
  serverPrefetch() {
    return this.loadAlbums()
  },
  mounted() {
    if (!this.albumsArray.length) {
      this.loadAlbums()
    }
  },
  methods: mapActions(['loadAlbums'])
}
</script>
