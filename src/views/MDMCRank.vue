<template>
<div>
  <progress class="progress is-small" max="100" v-if="!currentRank"></progress>
  <core v-else :currentRank="currentRank"></core>
</div>
</template>

<script>
import { useMdmcStore } from '../stores/mdmc'

import Core from '../components/rankCore.vue'

export default {
  props: ['id', 'difficulty'],
  components: {
    Core
  },
  computed: {
    rankCache() { return useMdmcStore().rankCache },
    currentRank() {
      return this.rankCache[`${this.id}_${this.difficulty}`]
    }
  },
  mounted() {
    this.mount()
  },
  watch: {
    difficulty: 'mount'
  },
  methods: {
    mount() {
      if (!this.currentRank) {
        const { id, difficulty } = this
        useMdmcStore().loadRank({ id, difficulty })
      }
    }
  }
}
</script>
