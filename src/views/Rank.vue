<template>
<div>
  <nav class="level">
    <div class="level-item">
      <router-link class="button is-rounded" exact-active-class="is-primary" :to="`/music/${uid}/${difficulty}/mobile`">Mobile</router-link>
    </div>
    <div class="level-item">
      <router-link class="button is-rounded" exact-active-class="is-primary" :to="`/music/${uid}/${difficulty}`">All</router-link>
    </div>
    <div class="level-item">
      <router-link class="button is-rounded" exact-active-class="is-primary" :to="`/music/${uid}/${difficulty}/pc`">PC</router-link>
    </div>
  </nav>
  <progress class="progress is-small" max="100" v-if="!currentRank"></progress>
  <core v-else :currentRank="currentRank" :platform="platform"></core>
</div>
</template>

<script>
import { mapState, mapActions } from 'vuex'

import Core from '@/components/rankCore.vue'

export default {
  props: {
    uid: String,
    difficulty: String,
    platform: {
      type: String,
      default: 'all'
    }
  },
  components: {
    Core
  },
  computed: {
    ...mapState(['rankCache']),
    currentRank() {
      return this.rankCache[`${this.uid}_${this.platform}_${this.difficulty}`]
    }
  },
  mounted() {
    this.mount()
  },
  watch: {
    platform: 'mount',
    difficulty: 'mount'
  },
  methods: {
    ...mapActions(['loadRank']),
    mount() {
      if (!this.currentRank) {
        const { uid, platform, difficulty } = this
        this.loadRank({ uid, platform, difficulty })
      }
    }
  }
}
</script>
