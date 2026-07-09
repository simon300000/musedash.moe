<template>
<div>
  <nav class="level">
    <div class="level-item">
      <router-link class="button is-rounded platform-button" exact-active-class="is-primary" :to="`/music/${uid}/${difficulty}/mobile`">Mobile</router-link>
    </div>
    <div class="level-item">
      <router-link class="button is-rounded platform-button" exact-active-class="is-primary" :to="`/music/${uid}/${difficulty}`">All</router-link>
    </div>
    <div class="level-item">
      <router-link class="button is-rounded platform-button" exact-active-class="is-primary" :to="`/music/${uid}/${difficulty}/pc`">PC</router-link>
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
  <core v-else :currentRank="currentRank" :platform="effectivePlatform"></core>
</div>
</template>

<script>
import { useMainStore } from '../stores/main'

import Core from '../components/rankCore.vue'

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
    rankCache() { return useMainStore().rankCache },
    rankUpdateTimeCache() { return useMainStore().rankUpdateTimeCache },
    effectivePlatform() { return this.platform || 'all' },
    currentRank() {
      return this.rankCache[`${this.uid}_${this.effectivePlatform}_${this.difficulty}`]
    },
    updateTime() {
      return this.rankUpdateTimeCache[`${this.uid}_${this.effectivePlatform}_${this.difficulty}`]
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
    loadRank(p) { return useMainStore().loadRank(p) },
    updateRank(p) { return useMainStore().updateRank(p) },
    mount() {
      if (!this.currentRank) {
        const { uid, effectivePlatform: platform, difficulty } = this
        this.loadRank({ uid, platform, difficulty })
      }
    },
    update() {
      const { uid, effectivePlatform: platform, difficulty } = this
      this.updateRank({ uid, platform, difficulty })
    }
  }
}
</script>

<style scoped>
.platform-button {
  border-color: var(--bulma-border);
}
</style>
