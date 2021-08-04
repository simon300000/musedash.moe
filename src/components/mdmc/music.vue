<template>
<core :music="music" :difficulties="difficulties" :albumName="false" :levelDesigner="levelDesigner" :src="src"></core>
</template>

<script>
import Capsule from '@/components/capsule'
import Core from '@/components/musicCore'

export default {
  props: ['music'],
  components: {
    Capsule,
    Core
  },
  computed: {
    src() {
      return `https://mdmc.moe/charts/${this.music.id}/cover.png`
    },
    difficulties() {
      const { difficulty1, difficulty2, difficulty3, id } = this.music
      return [difficulty1, difficulty2, difficulty3, '0'].map((level, i) => ({ level, link: `/mdmc/chart/${id}/${i}` }))
    },
    levelDesigner() {
      const { levelDesigner1, levelDesigner2, levelDesigner3 } = this.music
      const levelDesigners = [levelDesigner1, levelDesigner2, levelDesigner3]
      const ls = [...new Set(levelDesigners)]
      if (ls.length === 1) {
        return [levelDesigner1]
      }
      return levelDesigners
    }
  }
}
</script>

<style>

</style>
