<template>
<div>
  <input class="input" v-model="search" type="text" placeholder="Search Music">
  <hr v-if="finds.length">
  <div v-if="search.length && !finds.length">
    <br>
    <p>No result</p>
  </div>
  <music v-for="music in finds" :key="`find_${music.id}`" :music="music"></music>
  <hr>
</div>
</template>

<script>
import Music from '@/components/mdmc/music.vue'

export default {
  data() {
    return { search: '' }
  },
  props: ['album'],
  components: { Music },
  computed: {
    musicMap() {
      return this.album
        .map(music => ({
          music,
          string: ['name', 'author', 'levelDesigner']
            .map(p => music[p])
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
        .map(({ music }) => music)
    }
  }
}
</script>

<style>

</style>
