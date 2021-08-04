<template>
<core :music="music" :albumName="albumName" :albumLink="albumLink" :levelDesigner="levelDesigner" :src="src" :difficulties="difficulties"></core>
</template>

<script>
import { mapState, mapGetters } from 'vuex'

import Capsule from './capsule'
import Core from './musicCore'

export default {
  props: ['music', 'platform', 'level', 'hideAlbum'],
  components: {
    Capsule,
    Core
  },
  computed: {
    ...mapState(['lang', 'fullAlbums']),
    ...mapGetters(['musicAlbum']),
    src() {
      return `/covers/${this.music.cover}.png`
    },
    album() {
      return this.musicAlbum[this.music.uid]
    },
    albumName() {
      return !this.hideAlbum && this.fullAlbums[this.album][this.lang].title
    },
    albumLink() {
      return `/albums/${this.album}`
    },
    levelDesigner() {
      const levelDesigner = this.music.levelDesigner
      if (levelDesigner[this.level]) {
        return [levelDesigner[this.level]]
      } else {
        const s = [...new Set(levelDesigner)]
        if (s.length === 1) {
          return [levelDesigner[0]]
        } else {
          return levelDesigner
        }
      }
    },
    difficulties() {
      const uid = this.music.uid
      const platform = this.platform
      return this.music.difficulty.map((level, i) => ({ level, link: `/music/${uid}/${i}${platform ? `/${platform}` : ''}` }))
    }
  }
}
</script>
