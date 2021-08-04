<template>
<div>
  <progress class="progress is-small" max="100" v-if="!currentPlayer"></progress>
  <template v-else>
    <section class="hero full-width">
      <div class="hero-body">
        <div class="container">
          <h1 class="title">
            {{currentPlayer.user.nickname}}
          </h1>
          <h2 class="subtitle">
            {{id}}
          </h2>
        </div>
      </div>
    </section>
    <nav class="level">
      <div class="level-item has-text-centered">
        <div>
          <p class="heading">Records</p>
          <p class="title">{{plays.length}}</p>
        </div>
      </div>
      <div class="level-item has-text-centered">
        <div>
          <p class="heading">Perfects</p>
          <p class="title">{{perfect.length}}</p>
        </div>
      </div>
      <div class="level-item has-text-centered">
        <div>
          <p class="heading">Avg. Pct</p>
          <p class="title">{{avgPct}} %</p>
        </div>
      </div>
    </nav>
    <record v-for="play in plays" :play="play" :key="`${play.platform}_${play.difficulty}_${play.uid}`"></record>
  </template>
</div>
</template>

<script>
import { mapActions, mapState, mapGetters, mapMutations } from 'vuex'

import record from '@/components/record.vue'

export default {
  props: ['id'],
  components: {
    record
  },
  watch: {
    title: {
      immediate: true,
      handler(title) {
        if (title) {
          this.updateTitle([this, title])
        }
      }
    }
  },
  beforeDestroy() {
    this.removeTitle(this)
  },
  computed: {
    ...mapState(['userCache']),
    ...mapGetters(['albumsArray']),
    currentPlayer() {
      return this.userCache[this.id]
    },
    title() {
      return this.currentPlayer?.user.nickname
    },
    plays() {
      return [...this.currentPlayer.plays]
        .sort(({ score: a }, { score: b }) => b - a)
        .sort(({ i: a }, { i: b }) => a - b)
    },
    perfect() {
      return this.plays
        .filter(({ acc }) => acc === 100)
    },
    avgPct() {
      return Math.round(this.plays
        .reduce(({ acc: a }, { acc: b }) => ({ acc: a + b }))
        .acc / this.plays.length * 10) / 10
    }
  },
  async serverPrefetch() {
    await this.loadAlbums()
    await this.loadUser(this.id)
    this.updateTitle([this, this.title])
  },
  async mounted() {
    if (!this.albumsArray.length) {
      await this.loadAlbums()
    }
    if (!this.currentPlayer) {
      this.loadUser(this.id)
    }
  },
  methods: {
    ...mapActions(['loadAlbums', 'loadUser']),
    ...mapMutations(['updateTitle', 'removeTitle'])
  }
}
</script>
