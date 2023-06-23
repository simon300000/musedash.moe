<template>
<div :style="{height: `${totalHeight}px`}" ref="container">
  <div class="table-container" :style="{top: `${skipHeight}px`}" style="position: relative;">
    <table class="table is-fullwidth is-hoverable is-striped">
      <thead>
        <tr>
          <th>#</th>
          <th></th>
          <th>Username <input class="input search" type="text" placeholder="Search everything" v-model="search" ref="search"></th>
          <th class="th-left">Accuracy</th>
          <th class="th-left">Score</th>
          <th v-if="platform === 'all'">Platform</th>
          <th>Configure</th>
          <th v-if="raw && platform">Raw Data</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="play in rankSliced" :key="play.indexKey">
          <td>{{play.index+1}}</td>
          <td><template v-if="play.index!==play.lastRank">
              <change :before="play.lastRank" :after="play.index"></change>
            </template></td>
          <td class="nowarp ellipsis">
            <router-link :to="play.url">{{play.nickname}}</router-link>
          </td>
          <td>{{Math.round(play.acc*100)/100}}%</td>
          <td>{{play.score}}</td>
          <td v-if="platform === 'all'">
            <octicon type="desktop" size="17" style="float:right;" v-if="play.platform === 'pc'"></octicon>
            <octicon type="mobile" size="17" v-else></octicon>
          </td>
          <td style="text-align:center;" class="nowarp">{{characters[play.character]}} / {{elfins[play.elfin]}}</td>
          <td v-if="raw && platform" class="no-padding">
            <pre v-if="rawMap[`${play.uid}-${play.difficulty}-${play.platform || platform}-${play.id}`]"><code>{{rawMap[`${play.uid}-${play.difficulty}-${play.platform || platform}-${play.id}`]}}</code></pre>
            <button v-else class="button is-text is-small" @click="loadRaw(play)">Load</button>
          </td>
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

import { getRankRaw } from '@/api'

const threshold = Array(300).fill().map((_, i) => i / 300)

const renderLength = 120
const rowHeight = 41

export default {
  data() {
    return {
      observer: undefined,
      skipRatio: 0,
      search: '',
      raw: localStorage.rawEnabled === 'true',
      vt: localStorage.vt === 'true',
      rawMap: {}
    }
  },
  components: {
    Octicon,
    change
  },
  methods: {
    async loadRaw({ id, uid, difficulty, platform: p }) {
      const platform = p || this.platform
      const key = `${uid}-${difficulty}-${platform}-${id}`
      this.rawMap = { ...this.rawMap, [key]: 'loading...' }
      const data = await getRankRaw({ id, uid, difficulty, platform })
      this.rawMap = { ...this.rawMap, [key]: data }
    }
  },
  props: ['currentRank', 'platform'],
  computed: {
    ...mapGetters(['elfins', 'characters']),
    renderLength() {
      return Math.min(renderLength, this.maxLength)
    },
    maxLength() {
      return this.rankSearched.length
    },
    totalHeight() {
      return (this.maxLength + 1) * rowHeight
    },
    skipHeight() {
      if (this.vt) {
        return 0
      }
      return this.skipNum * rowHeight
    },
    rankSearched() {
      const filled = this.currentRank
      const keys = this.search.split(' ').filter(Boolean).map(key => key.toLowerCase())
      if (keys.length === 0) {
        return filled
      }
      return filled.filter(rank => {
        const { nickname = '', character, elfin, score = '', acc = '', id = '', index } = rank
        const name = nickname.toLowerCase()
        const characterLowercase = (this.characters[character] || '').toLowerCase()
        const elfinLowercase = (this.elfins[elfin] || '').toLowerCase()
        const scoreString = String(score)
        const accString = String(acc * 100)
        const indexString = String(index + 1)
        return keys.every(key => name.includes(key) || id.includes(key) || indexString === key || characterLowercase.includes(key) || elfinLowercase.includes(key) || scoreString.includes(key) || accString.includes(key))
      })
    },
    rankKeyed() {
      const search = this.rankSearched
      if (this.vt) {
        return search.map((rest, i) => ({ ...rest, indexKey: `rank_${i}` }))
      }
      return search.map((rest, i) => ({ ...rest, indexKey: `rank_${i % renderLength}` }))
    },
    rankSliced() {
      const rankKeyed = this.rankKeyed
      if (this.vt) {
        return rankKeyed
      }
      return rankKeyed.slice(this.skipNum, this.skipNum + this.renderLength)
    },
    skipNum() {
      const skip = Math.floor(this.skipRatio * this.maxLength)
      const skipEven = skip % 2 === 0 ? skip : skip - 1
      const result = Math.max(0, Math.min(this.maxLength - renderLength, skipEven - 2 * Math.floor(renderLength / 8)))
      if (result > 0 && document.activeElement === this.$refs.search) {
        this.$refs.search.blur()
      }
      return result
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

.search {
  width: 30%;
  min-width: 70px;
  font-size: 0.75em;
  margin-left: 5%;
}

.no-padding {
  padding: 0;
}
</style>
