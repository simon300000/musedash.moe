<template>
<div>
  <section class="hero full-width">
    <div class="hero-body">
      <div class="level">
        <div class="level-item">
          <div class="container">
            <div>
              <h1 class="title">
                {{current.user.nickname}}
              </h1>
            </div>
            <div>
              <h2 class="subtitle">
                {{id}}
              </h2>
            </div>
          </div>
        </div>
        <div class="level-item" v-if="current.user.avatar">
          <figure class="image is-128x128">
            <img class="is-rounded" :src="current.user.avatar" alt="Steam Avatar">
          </figure>
        </div>
        <div class="level-item" v-if="current.rl !== undefined">
          <div class="container">
            <div>
              <h1 class="title" :title="current.rl">
                『{{rl}}』
              </h1>
            </div>
            <div>
              <router-link to="/rd">
                <h2 class="subtitle is-6">
                  → Relative Level
                </h2>
              </router-link>
            </div>
          </div>
        </div>
        <div class="level-item" v-if="current.lastUpdate">
          <p>Last update {{updateTimeDiff}}</p>
        </div>
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
  <record v-for="play in plays" :play="play" :src="play.src" :name="play.name" :lv="play.lv" :author="play.author" :link="play.link" :sum-link="play.sumLink" :elfin="play.elfin" :character="play.character" :key="`${play.platform}_${play.difficulty}_${play.uid}`"></record>

</div>
</template>

<script>
import Octicon from '@/components/octicon.vue'
import record from '@/components/record.vue'

export default {
  props: ['plays', 'current', 'id'],
  components: {
    Octicon,
    record
  },
  computed: {
    perfect() {
      return this.plays
        .filter(({ acc }) => acc === 100)
    },
    avgPct() {
      return Math.round(this.plays.reduce((a, { acc: b }) => a + b, 0) / this.plays.length * 10) / 10
    },
    rl() {
      return Math.round(1000 * this.current.rl) / 1000
    },
    updateTimeDiff() {
      if (!this.current.lastUpdate) {
        return false
      }
      const now = Date.now()
      const diff = now - this.current.lastUpdate
      const diffMin = Math.floor(diff / 1000 / 60)
      const diffHour = Math.floor(diffMin / 60)
      if (diffHour > 0) {
        return `${diffHour}h ago`
      }
      return `${diffMin}min ago`
    }
  }
}
</script>
