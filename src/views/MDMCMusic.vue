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
import { createNamespacedHelpers, mapMutations } from 'vuex'

import Music from '@/components/mdmc/music'

const { mapState, mapActions } = createNamespacedHelpers('mdmc')

export default {
  props: ['id'],
  watch: {
    music: {
      immediate: true,
      handler(music) {
        if (music) {
          this.updateTitle([this, music.name])
        }
      }
    }
  },
  computed: {
    ...mapState(['album']),
    music() {
      return Object.fromEntries(this.album.map(({ id, ...rest }) => [id, { ...rest, id }]))[this.id]
    }
  },
  components: { Music },
  beforeDestroy() {
    this.removeTitle(this)
  },
  async serverPrefetch() {
    await this.loadAlbum()
    this.updateTitle([this, this.music.name])
  },
  methods: {
    ...mapActions(['loadAlbum']),
    ...mapMutations(['removeTitle', 'updateTitle'])
  },
  mounted() {
    if (!this.album.length) {
      this.loadAlbum()
    }
  }
}
</script>

<style>

</style>
