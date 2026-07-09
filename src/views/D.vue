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
    *New music: will be added to the calculation after 1 week
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
import { useMainStore } from '../stores/main'

import { characterSkip, elfinSkip } from '../../api/config'

import Diffs from '../components/diffs.vue'

export default {
  components: {
    Diffs
  },
  computed: {
    diffDiff() { return useMainStore().diffDiff },
    albumsArray() { return useMainStore().albumsArray },
    elfins() { return useMainStore().elfins },
    characters() { return useMainStore().characters },
    characterSkip() {
      return characterSkip.map(i => this.characters[i]).join(', ')
    },
    elfinSkip() {
      return elfinSkip.map(i => this.elfins[i]).join(', ')
    }
  },
  mounted() {
    const store = useMainStore()
    if (!store.albumsArray.length) {
      store.loadAlbums()
    }
    if (!store.diffDiff.length) {
      store.loadDiffDiff()
    }
  }
}
</script>
