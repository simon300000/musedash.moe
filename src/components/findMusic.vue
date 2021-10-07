<template>
<div>
  <input class="input" v-model="search" type="text" placeholder="Search Music">
  <hr v-if="finds.length">
  <music :music="allMusics['0-0']" class="abs" style="top: -1000px;" ref="size"></music>
  <div class="musicContainer" ref="container" :style="{height:`${sumHeight}px`}">
    <music v-for="{music, key, top} in findsRender" :key="key" :music="music" class="abs" :style="`top: ${top}px;`"></music>
  </div>
  <hr v-if="finds.length">
</div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'

import music from '@/components/music.vue'

const RENDER_LENGTH = 24

const threshold = Array(100).fill().map((_, i) => i / 100)

export default {
  data() {
    return {
      search: '',
      unitHeight: 152,
      skipRatio: 0,
      resizeObserver: undefined,
      intersectionObserver: undefined
    }
  },
  components: { music },
  computed: {
    ...mapState(['lang']),
    ...mapGetters(['allMusics']),
    musicMap() {
      return Object.values(this.allMusics)
        .map(music => ({
          music,
          string: ['ChineseS', 'ChineseT', 'English', 'Japanese', 'Korean']
            .map(lang => music[lang])
            .flatMap(({ author, name }) => [author, name])
            .concat(music.levelDesigner)
            .join('')
            .toLocaleLowerCase()
        }))
    },
    finds() {
      if (!this.search) {
        return []
      }
      const keys = this.search.toLocaleLowerCase().split(' ')
      return this.musicMap
        .filter(({ string }) => !keys.find(key => !string.includes(key)))
        .map(({ music }) => ({ ...music, ...music[this.lang] }))
    },
    findsPrepare() {
      return this.finds.map((music, i) => ({ music, key: `find_${i}`, top: this.unitHeight * i }))
    },
    findsRender() {
      const sumLength = this.findsPrepare.length
      if (RENDER_LENGTH >= sumLength) {
        return this.findsPrepare
      }
      const skip = Math.max(0, Math.min(sumLength - RENDER_LENGTH, Math.floor(this.skipRatio * sumLength) - RENDER_LENGTH / 2))
      return this.findsPrepare.slice(skip, skip + RENDER_LENGTH)
    },
    sumHeight() {
      return this.unitHeight * this.finds.length
    }
  },
  mounted() {
    this.resizeObserver = new ResizeObserver(([{ contentRect: { height } }]) => {
      this.unitHeight = height + 24
    })
    this.resizeObserver.observe(this.$refs.size.$el)

    this.intersectionObserver = new IntersectionObserver(([{ intersectionRatio }]) => {
      this.skipRatio = intersectionRatio
    }, {
      rootMargin: '999999px 0px -50% 0px',
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
.musicContainer {
  position: relative;
}

.abs {
  position: absolute;
  width: 100%;
}
</style>
