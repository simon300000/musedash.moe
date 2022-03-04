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
  <nav class="level">
    <div class="level-item">
      <p>Last update {{updateTimeDiff}}</p>
    </div>
    <div class="level-item">
      <button :disabled="!update2hAgo" @click="update" class="button is-rounded" title="Refresh">🌀</button>
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
    ...mapState(['rankCache', 'rankUpdateTimeCache']),
    currentRank() {
      return this.rankCache[`${this.uid}_${this.platform}_${this.difficulty}`]
    },
    updateTime() {
      return this.rankUpdateTimeCache[`${this.uid}_${this.platform}_${this.difficulty}`]
    },
    update2hAgo() {
      if (!this.updateTime) {
        return false
      }
      return Date.now() - 1000 * 60 * 60 * 2 > this.updateTime
    },
    updateTimeDiff() {
      if (!this.updateTime) {
        return '...'
      }
      const now = Date.now()
      const diff = now - this.updateTime
      const diffMin = Math.floor(diff / 1000 / 60)
      const diffHour = Math.floor(diffMin / 60)
      if (diffHour > 0) {
        return `${diffHour}h ago`
      }
      return `${diffMin}min ago`
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
    ...mapActions(['loadRank', 'updateRank']),
    mount() {
      if (!this.currentRank) {
        const { uid, platform, difficulty } = this
        this.loadRank({ uid, platform, difficulty })
      }
    },
    update() {
      const { uid, platform, difficulty } = this
      this.updateRank({ uid, platform, difficulty })
    }
  }
}
</script>
