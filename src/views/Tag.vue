<template>
<div>
  <br>
  <div v-for="{json, musics} in currentTag" :key="json">
    <p class="album-title">{{fullAlbums[json][lang].title}}</p>
    <Album :album="json" :only="musics"></Album>
    <hr>
  </div>
</div>
</template>

<script>
import { mapGetters, mapState } from 'vuex'

import Album from './Album.vue'

export default {
  props: ['name'],
  components: {
    Album
  },
  computed: {
    ...mapState(['fullAlbums', 'lang']),
    ...mapGetters(['tagMap']),
    currentTag() {
      return this.tagMap[this.name]
    }
  }
}
</script>

<style scoped>
.album-title {
  text-align: center;
  font-weight: bold;
  font-size: 28px;
}
</style>
