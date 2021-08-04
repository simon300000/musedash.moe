<template>
<div>
  <progress class="progress is-small" max="100" v-if="!currentRank"></progress>
  <core v-else platform="pc" :currentRank="currentRank"></core>
</div>
</template>

<script>
import { createNamespacedHelpers } from 'vuex'

import Core from '@/components/rankCore.vue'

const { mapState, mapActions } = createNamespacedHelpers('mdmc')

export default {
  props: ['id', 'difficulty'],
  components: {
    Core
  },
  computed: {
    ...mapState(['rankCache']),
    currentRank() {
      return this.rankCache[`${this.id}_${this.difficulty}`]
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
        const { id, difficulty } = this
        this.loadRank({ id, difficulty })
      }
    }
  }
}
</script>
