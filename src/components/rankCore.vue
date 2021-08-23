<template>
<div class="table-container">
  <table class="table is-fullwidth is-hoverable is-striped">
    <thead>
      <tr>
        <th>#</th>
        <th></th>
        <th>Username</th>
        <th class="th-left">Accuracy</th>
        <th class="th-left">Score</th>
        <th v-if="platform === 'all'">Platform</th>
        <th>Configure</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(play, index) in currentRankLimit" :key="`${play.id}_${play.platform || platform}`">
        <td>{{index+1}}</td>
        <td><template v-if="index!==play.lastRank">
            <change :before="play.lastRank" :after="index"></change>
          </template></td>
        <td class="nowarp ellipsis">
          <router-link :to="play.url">{{play.nickname}}</router-link>
        </td>
        <td>{{Math.round(play.acc*10)/10}}%</td>
        <td>{{play.score}}</td>
        <td v-if="platform === 'all'">
          <octicon type="desktop" size="17" style="float:right;" v-if="play.platform === 'pc'"></octicon>
          <octicon type="mobile" size="17" v-else></octicon>
        </td>
        <td style="text-align:center;" class="nowarp">{{characters[play.character]}} / {{elfins[play.elfin]}}</td>
      </tr>
    </tbody>
  </table>
</div>
</template>

<script>
import { mapGetters } from 'vuex'

import Octicon from '@/components/octicon.vue'
import change from '@/components/change.vue'

export default {
  data() {
    return {
      limit: 250
    }
  },
  components: {
    Octicon,
    change
  },
  props: ['currentRank', 'platform'],
  computed: {
    ...mapGetters(['elfins', 'characters']),
    currentRankLimit() {
      return this.currentRank.filter((_, i) => i < this.limit)
    }
  },
  destroyed() {
    document.onscroll = null
  },
  watch: {
    currentRank() {
      this.limit = 250
    }
  },
  mounted() {
    this.$nextTick(function() {
      document.onscroll = () => {
        if (document.body.clientHeight - window.innerHeight - window.scrollY < document.body.clientHeight / 2) {
          if (this.limit < this.currentRank.length) {
            this.limit *= 2
          }
        }
      }
    })
  }
}
</script>

<style scoped>
.th-left {
  text-align: left !important;
}

.nowarp {
  white-space: nowrap;
}

.ellipsis {
  text-overflow: ellipsis;
  max-width: 11em;
  overflow: hidden;
}
</style>
