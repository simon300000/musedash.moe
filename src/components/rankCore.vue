<template>
<div :style="{height: `${totalHeight}px`}" ref="container">
  <div class="table-container" :style="{top: `${skipHeight}px`}" style="position: relative;">
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
        <tr v-for="play in currentRankFiltered" :key="play.indexKey">
          <td>{{play.index+1}}</td>
          <td><template v-if="play.index!==play.lastRank">
              <change :before="play.lastRank" :after="play.index"></change>
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
</div>
</template>

<script>
import { mapGetters } from 'vuex'

import Octicon from '@/components/octicon.vue'
import change from '@/components/change.vue'

const threshold = Array(300).fill().map((_, i) => i / 300)

const renderLength = 80
const rowHeight = 41

export default {
  data() {
    return {
      observer: undefined,
      skipRatio: 0
    }
  },
  components: {
    Octicon,
    change
  },
  props: ['currentRank', 'platform'],
  computed: {
    ...mapGetters(['elfins', 'characters']),
    renderLength() {
      return Math.min(renderLength, this.currentRank.length)
    },
    totalHeight() {
      return (this.currentRank.length + 1) * rowHeight
    },
    skipHeight() {
      return this.skipNum * rowHeight
    },
    currentRankFilled() {
      return this.currentRank.map((rest, index) => ({ ...rest, index, indexKey: `rank_${index % renderLength}` }))
    },
    currentRankFiltered() {
      return this.currentRankFilled.slice(this.skipNum, this.skipNum + this.renderLength)
    },
    skipNum() {
      const skip = Math.floor(this.skipRatio * this.currentRank.length)
      const skipEven = skip % 2 === 0 ? skip : skip - 1
      return Math.max(0, Math.min(this.currentRank.length - renderLength, skipEven - 2 * Math.floor(renderLength / 8)))
    }
  },
  mounted() {
    this.observer = new IntersectionObserver(([{ intersectionRatio }]) => {
      this.skipRatio = intersectionRatio
    }, {
      rootMargin: '999999px 0px -120% 0px',
      root: null,
      threshold
    })

    this.observer.observe(this.$refs.container)
  },
  beforeDestroy() {
    this.observer.disconnect()
  },
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
