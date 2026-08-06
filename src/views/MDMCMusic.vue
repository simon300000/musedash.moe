<template>
<div>
  <progress class="progress is-small" max="100" v-if="!album.length"></progress>

  <template v-else-if="music">
    <music :music="music"></music>
    <router-view></router-view>
  </template>

  <p v-else>Music not found.</p>
</div>
</template>

<script>
import { useMdmcStore } from '../stores/mdmc'
import { useMainStore } from '../stores/main'

import Music from '../components/mdmc/music.vue'

export default {
  props: ['id'],
  watch: {
    music: {
      immediate: true,
      handler(music) {
        if (music) {
          useMainStore().updateTitle(this, music.name)
        }
      }
    }
  },
  computed: {
    album() { return useMdmcStore().album },
    music() {
      return Object.fromEntries(this.album.map(({ id, ...rest }) => [id, { ...rest, id }]))[this.id]
    }
  },
  components: { Music },
  beforeUnmount() {
    useMainStore().removeTitle(this)
  },
  async serverPrefetch() {
    await useMdmcStore().loadAlbum()
    if (this.music) {
      useMainStore().updateTitle(this, this.music.name)
    }
  },
  mounted() {
    if (!useMdmcStore().album.length) {
      useMdmcStore().loadAlbum()
    }
  }
}
</script>

<style>

</style>
