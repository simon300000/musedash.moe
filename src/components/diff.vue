<template>
<nav class="level">
  <div class="level-left">
    <div class="level-item">
      <figure class="image is-128x128">
        <img class="is-rounded" :src="w.src" :alt="w.src">
      </figure>
    </div>
  </div>
  <div class="level-item">
    <div>
      <p class="title is-5 is-spaced" v-html="w.name"></p>
      <p class="subtitle is-6" title="Author">{{w.author}}</p>
      <router-link :to="w.albumLink" v-if="w.albumName">
        <p class="subtitle is-6 clickable">「{{w.albumName}}」</p>
      </router-link>
    </div>
  </div>
  <div class="level-item">
    <div>
      <p class="title is-3 is-spaced">「{{w.relative}}」</p>
      <p class="subtitle is-6">{{w.absolute}}</p>
    </div>
  </div>
  <div class="level-right">
    <capsule :difficulties="w.difficulties" :hide="true"></capsule>
  </div>
</nav>
</template>

<script>
import { mapGetters } from 'vuex'

import Capsule from './capsule'

export default {
  components: {
    Capsule,
  },
  props: ['i'],
  computed: {
    ...mapGetters(['diffDiffList']),
    w() {
      return this.diffDiffList[this.i] || {}
    }
  }
}
</script>

<style scoped>
.level-item {
  flex: 1;
}

.level-item:nth-child(2) {
  flex: 2;
}
</style>
