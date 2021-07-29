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
          <th>{{ha?'Benutzername':'Username'}}</th>
          <th class="th-left">{{ha?'Ungenauigkeit':'Accuracy'}}</th>
          <th class="th-left">{{ha?'Punkte':'Score'}}</th>
          <th v-if="platform === 'all'">{{ha?'Plattform':'Platform'}}</th>
          <th>Configure</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(play, index) in currentRankLimit" :key="`${play.id}_${play.platform || platform}`">
          <td>{{index+1}}</td>
          <td><template v-if="index!==play.lastRank">
              <change :before="play.lastRank" :after="index"></change>
            </template></td>
          <td>
            <router-link :to="`/player/${play.id}`">{{play.nickname}}</router-link>
          </td>
          <td>{{Math.round((ha?100-play.acc:play.acc)*10)/10}}%</td>
          <td>{{play.score}}</td>
          <td v-if="platform === 'all'">
            <span class="icon" style="float:right;" v-if="play.platform === 'pc'">
              <octicon name="device-desktop"></octicon>
            </span>
            <span class="icon" v-else>
              <octicon name="device-mobile"></octicon>
            </span>
          </td>
          <td style="text-align:center;">{{characters[play.character]}} / {{elfins[play.elfin]}}</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
</template>

<script>
import { mapState, mapActions, mapGetters } from 'vuex'

import Octicon from '@/components/vue-octicon/src/components/Octicon.vue'
import '@/components/vue-octicon/src/icons/device-desktop'
import '@/components/vue-octicon/src/icons/device-mobile'

import change from '@/components/change.vue'

export default {
  data() {
    return {
      ha: false,
      limit: 250
    }
  },
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
    ...mapState(['rankCache']),
    ...mapGetters(['elfins', 'characters']),
    currentRank() {
      return this.rankCache[`${this.uid}_${this.platform}_${this.difficulty}`]
    },
    currentRankLimit() {
      return this.currentRank.filter((_, i) => i < this.limit)
    }
  },
  mounted() {
    this.ha = new Date().getMonth() + 1 === 4 && new Date().getDate() === 1
    this.mount()
  },
  destroyed() {
    document.onscroll = null
  },
  watch: {
    platform: 'mount',
    difficulty: 'mount'
  },
  methods: {
    ...mapActions(['loadRank']),
    mount() {
      this.limit = 250

      if (!this.currentRank) {
        const { uid, platform, difficulty } = this
        this.loadRank({ uid, platform, difficulty })
      }

      this.$nextTick(function() {
        document.onscroll = () => {
          if (document.body.clientHeight - window.innerHeight - window.scrollY < document.body.clientHeight / 2 && this.currentRank?.length) {
            if (this.limit < this.currentRank.length) {
              this.limit *= 2
            } else {
              document.onscroll = null
            }
          }
        }
      })
    }
  }
}
</script>

<style scoped>
.th-left {
  text-align: left !important;
}
</style>
