<template>
<div :style="{height:`${sumHeight}px`}" ref="container">
  <diff i="0" ref="size"></diff>
  <diff :i="i" class="diff-relative" v-for="([i,key,p]) in renderArray" :key="key" :style="{top: `${p * height}px`}"></diff>
</div>
</template>

<script>
import { mapState } from 'vuex'

import Diff from '@/components/diff'

const RENDER_LENGTH = 12

const keys = Array(RENDER_LENGTH).fill().map((_, i) => `diffdiff_${i}`)

const threshold = Array(1000).fill().map((_, i) => i / 1000)

export default {
  components: {
    Diff
  },
  data() {
    return {
      resizeObserver: undefined,
      intersectionObserver: undefined,
      height: 128 + 24,
      skipRatio: 0,
    }
  },
  computed: {
    ...mapState(['diffDiff']),
    sumHeight() {
      return this.diffDiff.length * this.height
    },
    maxSkip() {
      return this.diffDiff.length - 1 - RENDER_LENGTH
    },
    skip() {
      return Math.max(0, Math.min(this.maxSkip, Math.round(this.skipRatio * this.diffDiff.length) - 3))
    },
    renderArray() {
      const pack = Math.floor(this.skip / RENDER_LENGTH)
      const packStart = RENDER_LENGTH * pack
      return Array(RENDER_LENGTH).fill().map((_, i) => {
        const index = packStart + i
        if (index < this.skip) {
          return [index + RENDER_LENGTH + 1, pack + 1]
        }
        return [index + 1, pack]
      }).map(([i, p], index) => ([i, keys[index], p * RENDER_LENGTH]))
    }
  },
  mounted() {
    this.resizeObserver = new ResizeObserver(([{ contentRect: { height } }]) => {
      this.height = height + 24
    })
    this.resizeObserver.observe(this.$refs.size.$el)

    this.intersectionObserver = new IntersectionObserver(([{ intersectionRatio }]) => {
      this.skipRatio = intersectionRatio
    }, {
      rootMargin: '999999px 0px -140% 0px',
      root: null,
      threshold
    })
    this.intersectionObserver.observe(this.$refs.container)
  },
  beforeDestroy() {
    this.resizeObserver.disconnect()
    this.intersectionObserver.disconnect()
  }
}
</script>

<style scoped>
.diff-relative {
  position: relative;
}
</style>
