<template>
<div>
  <section class="section">
    <div class="container">
      <progress class="progress is-small" max="100" v-if="!albums.length"></progress>
      <div class="tabs is-centered is-large" v-else>
        <ul>
          <router-link :to="`/albums/${album.json}`" active-class="is-active" tag="li" :key="album.json" v-for="album in albums">
            <a><span>{{album.title}}</span></a>
          </router-link>
        </ul>
      </div>
      <router-view></router-view>
    </div>
  </section>
</div>
</template>

<script>
import { mapState, mapActions } from 'vuex'

export default {
  components: {},
  computed: {
    ...mapState(['fullAlbums']),
    albums() {
      return this.fullAlbums.map(({ title, json }) => ({ title, json }))
    }
  },
  serverPrefetch() {
    return this.loadAlbums()
  },
  mounted() {
    if (!this.fullAlbums.length) {
      this.loadAlbums()
    }
  },
  methods: mapActions(['loadAlbums'])
}
</script>
