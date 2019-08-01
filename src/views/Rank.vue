<template>
<div>
  <nav class="level">
    <div class="level-item">
      <router-link class="button is-rounded" exact-active-class="is-primary" :to="`/music/${uid}/${difficulty}/mobile`">Mobile</router-link>
    </div>
    <div class="level-item">
      <router-link class="button is-rounded" exact-active-class="is-primary" :to="`/music/${uid}/${difficulty}`">All</router-link>
    </div>
    <div class="level-item">
      <router-link class="button is-rounded" exact-active-class="is-primary" :to="`/music/${uid}/${difficulty}/pc`">PC</router-link>
    </div>
  </nav>
  <progress class="progress is-small" max="100" v-if="!currentRank"></progress>
  <div class="table-container" v-if="currentRank">
    <table class="table is-fullwidth is-hoverable is-striped">
      <thead>
        <tr>
          <th>#</th>
          <th></th>
          <th>Username</th>
          <th>Accuracy</th>
          <th>Score</th>
          <th v-if="platform === 'all'">Platform</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(play, index) in currentRank" :key="`${play.id}_${play.platform || platform}`">
          <td>{{index+1}}</td>
          <td><template v-if="index!==play.lastRank">
              <change :before="play.lastRank" :after="index"></change>
            </template></td>
          <td>{{play.nickname}}</td>
          <td>{{Math.round(play.acc*10)/10}}%</td>
          <td>{{play.score}}</td>
          <td v-if="platform === 'all'">
            <span class="icon" style="float:right;" v-if="play.platform === 'pc'">
              <octicon name="device-desktop"></octicon>
            </span>
            <span class="icon" v-else>
              <octicon name="device-mobile"></octicon>
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
</template>

<script>
import { mapGetters, mapState, mapActions } from 'vuex'

import Octicon from '@/components/vue-octicon/src/components/Octicon.vue'
import '@/components/vue-octicon/src/icons/device-desktop'
import '@/components/vue-octicon/src/icons/device-mobile'

import change from '@/components/change.vue'

export default {
  props: {
    uid: String,
    difficulty: String,
    platform: {
      type: String,
      default: 'all'
    }
  },
  components: {
    Octicon,
    change
  },
  computed: {
    ...mapGetters(['allMusics']),
    ...mapState(['rankCache']),
    currentRank() {
      return this.rankCache[`${this.uid}_${this.platform}_${this.difficulty}`]
    }
  },
  mounted() {
    if (!this.currentRank) {
      const { uid, platform, difficulty } = this
      this.loadRank({ uid, platform, difficulty })
    }
  },
  beforeUpdate() {
    if (!this.currentRank) {
      const { uid, platform, difficulty } = this
      this.loadRank({ uid, platform, difficulty })
    }
  },
  methods: mapActions(['loadRank'])
}
</script>
