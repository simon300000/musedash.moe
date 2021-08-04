<template>
<div>
  <progress class="progress is-small" max="100" v-if="!album.length"></progress>

  <template v-else>
    <music :music="music"></music>
    <router-view></router-view>
  </template>
</div>
</template>

<script>
import { createNamespacedHelpers } from 'vuex'

import Music from '@/components/mdmc/music'

const { mapState, mapActions } = createNamespacedHelpers('mdmc')

export default {
  props: ['id'],
  computed: {
    ...mapState(['album']),
    music() {
      return Object.fromEntries(this.album.map(({ id, ...rest }) => [id, { ...rest, id }]))[this.id]
    }
  },
  components: { Music },
  MusicerverPrefetch() {
    return this.loadAlbum()
  },
  methods: mapActions(['loadAlbum']),
  mounted() {
    if (!this.album.length) {
      this.loadAlbum()
    }
  }
}
</script>

<style>

</style>
