<template>
<div>
  <form @submit="submit" class="full-width">
    <div class="field has-addons">
      <div class="control is-expanded" :class="{'is-loading': loading}">
        <input class="input" v-model="search" type="text" placeholder="Search Player">
      </div>
      <div class="control">
        <input type="submit" class="button is-info" value="Search">
      </div>
    </div>
    <p class="help" v-if="searched">Result: {{results.length}}</p>
  </form>
  <progress class="progress is-info" max="100" v-if="loading"></progress>
  <router-link class="level" v-for="[username, id] in results" :key="id" :to="`/player/${id}`">
    <div class="level-item has-text-centered">
      <div>
        <p class="heading black">{{id}}</p>
        <p class="title">{{username}}</p>
      </div>
    </div>
  </router-link>
</div>
</template>

<script>
import { mapMutations } from 'vuex'
import { searchPlayer } from '@/api'

export default {
  data() {
    return {
      loading: false,
      searching: undefined,
      search: '',
      results: [],
      searched: false
    }
  },
  watch: {
    search() {
      if (this.search !== this.searching) {
        this.loading = false
      }
    }
  },
  created() {
    this.updateTitle([this, 'Search'])
  },
  beforeDestroy() {
    this.removeTitle(this)
  },
  methods: {
    ...mapMutations(['updateTitle', 'removeTitle']),
    async submit(e) {
      e.preventDefault()
      if (this.searching !== this.search) {
        let search = this.search
        this.searching = search
        this.loading = true
        this.results = []
        this.searched = false
        let results = await searchPlayer(search)
        this.searching = undefined
        if (this.search === search) {
          this.loading = false
          this.searched = true
          this.results = results
        }
      }
    }
  }
}
</script>

<style scoped>
form {
  margin-bottom: 23.3px;
}

.black {
  color: #4a4a4a;
}
</style>
