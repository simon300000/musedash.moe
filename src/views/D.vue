<template>
<div>
  <h3 class="title is-3">「Relative Difficulty」</h3>
  <p>
    Music Difficulty, Calculated by comparing accuracy of same player on different music
    <br>
  </p>
  <br>
  <h3 class="title is-3">『Relative Level』</h3>
  <p>
    Performance of Player, Calculated from record performance
    <br>
    Highest record performance have greatest impact on the final result
    <br>
    *Record Performance: (accuracy - accuracy^2 + accuracy^4) * relative difficulty
    <br>
    *Impact on final result (higher to lower performance): 1, 0.8, 0.8^2, 0.8^3 ...
    <br>
    *Same music with different platform: count only higher accuracy
    <br>
    <br>
    Note, This is inaccurate, only a rough estimation based on the top 2000 players in each rank
  </p>
  <br>

  <p>
    Not included:
    <br>
    {{characterSkip}}
    <br>
    {{elfinSkip}}
    <br>
  </p>
  <hr>
  <diffs v-if="diffDiff.length && albumsArray.length"></diffs>
  <progress class="progress" max="100" v-else></progress>
</div>
</template>

<script>
import { mapState, mapActions, mapGetters } from 'vuex'

import { characterSkip, elfinSkip } from '../../api/config'

import Diffs from '@/components/diffs'

export default {
  components: {
    Diffs
  },
  computed: {
    ...mapState(['diffDiff']),
    ...mapGetters(['albumsArray', 'elfins', 'characters']),
    characterSkip() {
      return characterSkip.map(i => this.characters[i]).join(', ')
    },
    elfinSkip() {
      return elfinSkip.map(i => this.elfins[i]).join(', ')
    }
  },
  methods: {
    ...mapActions(['loadAlbums', 'loadDiffDiff']),
  },
  mounted() {
    if (!this.albumsArray.length) {
      this.loadAlbums()
    }
    if (!this.diffDiff.length) {
      this.loadDiffDiff()
    }
  }
}
</script>
