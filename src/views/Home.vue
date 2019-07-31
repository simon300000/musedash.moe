<template>
<div>
  <section class="section">
    <div class="container">
      <progress class="progress is-small" max="100" v-if="!albums.length"></progress>
      <div class="tabs is-centered is-large" v-if="albums.length">
        <ul>
          <router-link :to="`/albums/${album.json}`" active-class="is-active" tag="li" :key="album.json" v-for="album in albums">
            <a><span>{{album.title}}</span></a>
          </router-link>
        </ul>
      </div>
      <router-view v-if="albums.length"></router-view>
    </div>
  </section>
</div>
</template>

<script>
import { mapState, mapActions } from 'vuex'

export default {
  computed: {
    ...mapState(['lang', 'fullAlbums']),
    albumsArray() {
      return Object.values(this.fullAlbums)
    },
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
