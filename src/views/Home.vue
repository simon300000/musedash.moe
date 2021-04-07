<template>
<div>
  <progress class="progress is-small" max="100" v-if="!albums.length"></progress>
  <template v-if="albums.length">
    <findMusic></findMusic>
    <div class="tabs is-centered is-large">
      <ul>
        <router-link :to="`/albums/${album.json}`" :key="album.json" v-for="album in albums" custom v-slot="{ navigate, href, isActive }">
          <li @click="navigate" @keypress.enter="navigate" :class="{ 'is-active': isActive }"><a :href="href"><span>{{album.title}}</span></a></li>
        </router-link>
      </ul>
    </div>
  </template>
  <router-view v-if="albums.length"></router-view>
</div>
</template>

<script>
import { mapState, mapActions, mapGetters } from 'vuex'

import findMusic from '@/components/findMusic'

export default {
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
    if (!this.albumsArray.length) {
      this.loadAlbums()
    }
  },
  methods: mapActions(['loadAlbums'])
}
</script>
