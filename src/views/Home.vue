<template>
<div>
  <progress class="progress is-small" max="100" v-if="!albums.length"></progress>
  <findMusic v-if="albums.length"></findMusic>
  <div class="tabs is-centered is-large" ref="container" :class="{overflowhide: win}">
    <ul>
      <router-link :to="`/albums/${album.json}`" :key="album.json" v-for="album in albums" custom v-slot="{ navigate, href, isActive }">
        <li @click="navigate" @keypress.enter="navigate" :class="{ 'is-active': isActive }"><a :href="href"><span>{{album.title}}</span></a></li>
      </router-link>
    </ul>
  </div>
  <router-view v-if="albums.length"></router-view>
</div>
</template>

<script>
import { mapState, mapActions, mapGetters } from 'vuex'

import findMusic from '@/components/findMusic'

const onScroll = container => e => {
  const d = e.deltaY + e.deltaX
  container.scrollLeft += d
  e.preventDefault()
}

export default {
  data() {
    return {
      win: true,
      scrollEventListner: undefined
    }
  },
  components: { findMusic },
  computed: {
    ...mapState(['lang', 'fullAlbums']),
    ...mapGetters(['albumsArray']),
    albums() {
      return this.albumsArray.map(album => ({ title: album.title, json: album.json, ...(album[this.lang] || {}) }))
    }
  },
  serverPrefetch() {
    return this.loadAlbums()
  },
  mounted() {
    this.win = navigator.appVersion.includes('Win')
    if (!this.albumsArray.length) {
      this.loadAlbums()
    }
    const { container } = this.$refs
    this.scrollEventListner = onScroll(container)
    container.addEventListener('wheel', this.scrollEventListner)
  },
  beforeDestroy() {
    const { container } = this.$refs
    container.removeEventListener('wheel', this.scrollEventListner)
  },
  methods: mapActions(['loadAlbums'])
}
</script>

<style scoped>
.overflowhide::-webkit-scrollbar {
  display: none;
}
</style>
