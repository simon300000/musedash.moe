<template>
<nav class="level">
  <div class="level-item">
    <figure class="image is-128x128">
      <img class="is-rounded" :src="`/covers/${music.cover}.png`">
    </figure>
  </div>
  <div class="level-item">
    <div>
      <p class="title is-3 is-spaced">{{music.name}} <span class="subtitle is-6">Lv.{{lv}}</span></p>
      <p class="subtitle is-5 is-spaced">{{music.author}}</p>
    </div>
  </div>
  <div class="level-item">
    <div>
      <p class="title is-3 is-spaced">{{Math.round(play.acc*10)/10}}%</p>
      <p class="subtitle is-5 is-spaced">{{play.score}}</p>
      <p class="subtitle is-6 is-spaced">{{characters[play.character_uid]}} / {{elfins[play.elfin_uid]}}</p>
    </div>
  </div>
  <div class="level-item">
    <div>
      <router-link :to="`/music/${play.uid}/${play.difficulty}/${play.platform}`">
        <p class="title is-3 is-spaced clickable">
          <octicon v-if="play.platform === 'pc'" type="desktop" size="26"></octicon>
          <octicon v-else type="mobile" size="26"></octicon>
          #{{play.i+1}}
        </p>
      </router-link>
      <router-link :to="`/music/${play.uid}/${play.difficulty}`">
        <p class="subtitle is-6 is-spaced clickable">sum #{{play.sum+1}}</p>
      </router-link>
    </div>
  </div>
</nav>
</template>

<script>
import { mapGetters, mapState } from 'vuex'

import Octicon from '@/components/octicon.vue'

export default {
  props: ['play'],
  components: {
    Octicon
  },
  computed: {
    ...mapState(['lang']),
    ...mapGetters(['allMusics', 'elfins', 'characters']),
    music() {
      return { ...this.allMusics[this.play.uid], ...this.allMusics[this.play.uid][this.lang] }
    },
    lv() {
      return this.music.difficulty[this.play.difficulty]
    }
  }
}
</script>

<style scoped>
.clickable {
  cursor: pointer;
}

.level-item {
  flex: 1;
}

.level-item:nth-child(2) {
  flex: 2;
}
</style>
