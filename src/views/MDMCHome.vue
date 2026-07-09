<template>
<div>
  <h1 class="title">MDMC</h1>
  <h1 class="subtitle">Rank of <strong><a href="https://mdmc.moe" class="mdmcPink" target="_blank" rel="noopener noreferrer">Muse Dash Modding Community</a></strong>!</h1>

  <router-link to="/mdmc/player" class="button is-info">Player Search</router-link>
  <br>
  <br>
  <p>Note that mdmc is a community project, and have no relationship to the official Muse Dash and PeroPeroGames.</p>
  <hr>
  <progress class="progress is-small" max="100" v-if="!album.length"></progress>
  <template v-else>
    <find-music :album="album"></find-music>
    <music :music="music" v-for="music in album" :key="music.id"></music>
  </template>
</div>
</template>

<script>
import { useMdmcStore } from '../stores/mdmc'

import Music from '../components/mdmc/music.vue'
import FindMusic from '../components/mdmc/findMusic.vue'

export default {
  components: {
    Music,
    FindMusic
  },
  computed: {
    album() { return useMdmcStore().album }
  },
  serverPrefetch() {
    return useMdmcStore().loadAlbum()
  },
  mounted() {
    if (!useMdmcStore().album.length) {
      useMdmcStore().loadAlbum()
    }
  },
}
</script>

<style scoped>
.mdmcPink {
  color: #ff55c3;
}
</style>
