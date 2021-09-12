<template>
<div>
  <h1 class="title">Relative Difficulty</h1>
  <p>
    Calculated by comparing accuracy of same player on different songs
    <br>
    Not included:
    <br>
    {{characterSkip}}
    <br>
    {{elfinSkip}}
    <br>
  </p>
  <br>
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
