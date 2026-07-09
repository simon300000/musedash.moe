<template>
<nav class="level">
  <div class="level-left">
    <div class="level-item">
      <figure class="image is-128x128">
        <img class="is-rounded" :src="src" :alt="src" referrerpolicy="no-referrer" loading="lazy">
      </figure>
    </div>
  </div>
  <div class="level-item">
    <div>
      <p class="title is-5 is-spaced song-title" v-html="music.name"></p>
      <p class="subtitle is-6" title="Author">{{music.author}}</p>
      <router-link :to="albumLink" v-if="albumName">
        <p class="subtitle is-6 clickable">「{{albumName}}」</p>
      </router-link>
    </div>
  </div>
  <div class="level-item">
    <div>
      <p class="title is-6 is-spaced" title="Level Designer" v-for="(designer, i) in levelDesigner" :key="`${music.name}_${i}`">{{designer}}</p>
    </div>
  </div>
  <div class="level-item" v-if="diffdiff">
    <div>
      <p class="title is-3 is-spaced" title="Relative Difficulty">「{{diffdiff}}」</p>
    </div>
  </div>
  <div class="level-right">
    <capsule :difficulties="difficulties" :hide="hide"></capsule>
  </div>
</nav>
</template>

<script>
import Capsule from './capsule.vue'

export default {
  props: ['music', 'src', 'albumLink', 'albumName', 'levelDesigner', 'difficulties', 'diffdiff', 'hide'],
  components: { Capsule }
}
</script>

<style scoped>
.song-title {
  margin-bottom: 0 !important;
}
</style>
