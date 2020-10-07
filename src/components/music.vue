<template>
<nav class="level">
  <div class="level-left">
    <div class="level-item">
      <figure class="image is-128x128">
        <img class="is-rounded" :src="`/covers/${music.cover}.png`">
      </figure>
    </div>
  </div>
  <div class="level-item">
    <div>
      <p class="title is-5 is-spaced" v-html="music.name"></p>
      <p class="subtitle is-6" title="Author">{{music.author}}</p>
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
import Capsule from './capsule'

export default {
  props: ['music', 'platform'],
  components: {
    Capsule
  },
  computed: {
    levelDesigner() {
      const levelDesigner = this.music.levelDesigner
      const s = [...new Set(levelDesigner)]
      if (s.length === 1) {
        return [levelDesigner[0]]
      } else {
        return levelDesigner
      }
    }
  }
}
</script>
