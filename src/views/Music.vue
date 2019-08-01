<template>
<div>
  <progress class="progress is-small" max="100" v-if="!albumsArray.length"></progress>
  <template v-if="albumsArray.length">
    <music :music="currentMusic"></music>
  </template>
</div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

import music from '@/components/music.vue'

export default {
  props: ['uid'],
  components: {
    music
  },
  computed: {
    ...mapGetters(['allMusics', 'albumsArray']),
    currentMusic() {
      return this.allMusics[this.uid]
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
