<template>
<div>
  <h1 class="title">MDMC</h1>
  <h1 class="subtitle">Rank of <strong><a href="https://mdmc.moe" class="mdmcPink" target="_blank" rel="noopener noreferrer">Muse Dash Modding Community</a></strong>!</h1>

  <router-link to="/mdmc/player" class="button is-info">Player Search</router-link>
  <hr>
  <progress class="progress is-small" max="100" v-if="!album.length"></progress>
  <template v-else>
    <find-music :album="album"></find-music>
    <music :music="music" v-for="music in album" :key="music.id"></music>
  </template>
</div>
</template>

<script>
import { createNamespacedHelpers } from 'vuex'

import Music from '@/components/mdmc/music'
import FindMusic from '@/components/mdmc/findMusic'

const { mapState, mapActions } = createNamespacedHelpers('mdmc')

export default {
  components: {
    Music,
    FindMusic
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

<style scoped>
.mdmcPink {
  color: #ff55c3;
}
</style>
