<template>
<div>
  <input class="input" v-model="search" type="text" :placeholder="ha?'Musik suchen':'Search Music'">
  <hr v-if="finds.length">
  <music v-for="music in finds" :key="`find_${music.uid}`" :music="music"></music>
  <hr v-if="finds.length">
</div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'

import music from '@/components/music.vue'

export default {
  data() {
    return { ha: false, search: '' }
  },
  mounted() {
    this.ha = new Date().getMonth() + 1 === 4 && new Date().getDate() === 1
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
    }
  }
}
</script>

<style>

</style>
