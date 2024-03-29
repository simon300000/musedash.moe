<template>
<core :music="music" :albumName="albumName" :albumLink="albumLink" :levelDesigner="levelDesigner" :src="src" :difficulties="difficulties" :diffdiff="diffdiff"></core>
</template>

<script>
import { mapState, mapGetters } from 'vuex'

import Capsule from './capsule'
import Core from './musicCore'

import { loadCover } from '@/coverLoader'

export default {
  props: ['music', 'platform', 'level', 'hideAlbum'],
  components: {
    Capsule,
    Core
  },
  computed: {
    ...mapState(['lang', 'fullAlbums', 'diffDiffMusic']),
    ...mapGetters(['musicAlbum']),
    src() {
      return loadCover(this.music.cover)
    },
    diffdiff() {
      const diffdiff = this.diffDiffMusic[`${this.music.uid}_${this.level}`]
      if (diffdiff) {
        const { relative } = diffdiff
        return Math.round(relative * 100) / 100
      }
      return this.level && 'NaN'
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
      const { levelDesigner } = this.music
      if (levelDesigner[this.level]) {
        return [levelDesigner[this.level]]
      } else {
        const s = [...new Set(levelDesigner)]
        if (s.length === 1) {
          return [levelDesigner[0]]
        } else {
          return levelDesigner.filter(Boolean)
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
