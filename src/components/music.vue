<template>
<nav class="level">
  <div class="level-left">
    <div class="level-item">
      <figure class="image is-128x128">
        <img class="is-rounded" :src="src" :alt="src">
      </figure>
    </div>
  </div>
  <div class="level-item">
    <div>
      <p class="title is-5 is-spaced" v-html="music.name"></p>
      <p class="subtitle is-6" title="Author">{{music.author}}</p>
      <router-link :to="`/albums/${album}`" v-if="!hideAlbum">
        <p class="subtitle is-6 clickable">「{{albumName}}」</p>
      </router-link>
    </div>
  </div>
  <div class="level-item">
    <div>
      <p class="title is-6 is-spaced" title="Level Designer" v-for="(designer, i) in levelDesigner" :key="`${music.name}_${i}`">{{designer}}</p>
    </div>
  </div>
  <div class="level-right">
    <capsule :difficulty="music.difficulty" :platform="platform" :uid="music.uid"></capsule>
  </div>
</nav>
</template>

<script>
import { mapState, mapGetters } from 'vuex'

import Capsule from './capsule'

export default {
  props: ['music', 'platform', 'level', 'hideAlbum'],
  components: {
    Capsule
  },
  computed: {
    ...mapState(['lang', 'fullAlbums']),
    ...mapGetters(['musicAlbum']),
    src() {
      return `/covers/${this.music.cover}.png`
    },
    album() {
      return this.musicAlbum[this.music.uid]
    },
    albumName() {
      return this.fullAlbums[this.album][this.lang].title
    },
    levelDesigner() {
      const levelDesigner = this.music.levelDesigner
      if (levelDesigner[this.level]) {
        return [levelDesigner[this.level]]
      } else {
        const s = [...new Set(levelDesigner)]
        if (s.length === 1) {
          return [levelDesigner[0]]
        } else {
          return levelDesigner
        }
      }
    }
  }
}
</script>
