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
    </div>
  </div>
  <div class="level-item">
    <div>
      <router-link tag="p" class="title is-3 is-spaced clickable" :to="`/music/${play.uid}/${play.difficulty}/${play.platform}`">
        <octicon v-if="play.platform === 'pc'" name="device-desktop" width="24" height="24"></octicon>
        <octicon v-else name="device-mobile" width="15" height="24"></octicon>
        #{{play.i+1}}
      </router-link>
      <router-link tag="p" class="subtitle is-6 is-spaced clickable" :to="`/music/${play.uid}/${play.difficulty}`">{{ha?'Insgesamt':'sum'}} #{{play.sum+1}}</router-link>
    </div>
  </div>
</nav>
</template>

<script>
import { mapGetters, mapState } from 'vuex'

import Octicon from '@/components/vue-octicon/src/components/Octicon.vue'
import '@/components/vue-octicon/src/icons/device-desktop'
import '@/components/vue-octicon/src/icons/device-mobile'

export default {
  props: ['play'],
  components: {
    Octicon
  },
  data() { return { ha: false } },
  mounted() {
    this.ha = new Date().getMonth() + 1 === 4 && new Date().getDate() === 1
  },
  computed: {
    ...mapState(['lang']),
    ...mapGetters(['allMusics']),
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
</style>
