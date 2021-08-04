<template>
<div>
  <h1 class="title">MDMC</h1>
  <h1 class="subtitle">Rank of <strong><a href="https://mdmc.moe" target="_blank" rel="noopener noreferrer">Muse Dash Modding Community</a></strong>!</h1>
  <hr>
  <progress class="progress is-small" max="100" v-if="!album.length"></progress>
  <template v-else>
    <music :music="music" v-for="music in album" :key="music.id"></music>
  </template>
</div>
</template>

<script>
import { createNamespacedHelpers } from 'vuex'

import Music from '@/components/mdmc/music'

const { mapState, mapActions } = createNamespacedHelpers('mdmc')

export default {
  components: {
    Music
  },
  computed: {
    ...mapState(['album'])
  },
  methods: mapActions(['loadAlbum']),
  serverPrefetch() {
    return this.loadAlbum()
  },
  mounted() {
    if (!this.album.length) {
      this.loadAlbum()
    }
  },
}
</script>

<style>

</style>
