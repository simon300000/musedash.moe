<template>
<div>
  <nav class="level" v-for="music in musics" :key="music.uid">
    <div class="level-left">
      <div class="level-item">
        <figure class="image is-128x128">
          <img class="is-rounded" :src="`/covers/${music.cover}.png`">
        </figure>
      </div>
    </div>
    <div class="level-item"><strong>{{music.name}}</strong></div>
    <div class="level-item">{{music.author}}</div>
  </nav>
</div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  props: ['album'],
  computed: {
    ...mapState(['fullAlbums', 'lang']),
    currentAlbum() {
      return this.fullAlbums[this.album]
    },
    musics() {
      return Object.values(this.currentAlbum?.music || {})
        .map(music => ({ ...music, ...music[this.lang] }))
    }
  }
}
</script>
