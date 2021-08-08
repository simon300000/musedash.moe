<template>
<div>
  <section class="hero full-width">
    <div class="hero-body">
      <div class="container">
        <h1 class="title">
          {{current.user.nickname}}
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
      return Math.round(this.plays
        .reduce(({ acc: a }, { acc: b }) => ({ acc: a + b }))
        .acc / this.plays.length * 10) / 10
    }
  }
}
</script>
