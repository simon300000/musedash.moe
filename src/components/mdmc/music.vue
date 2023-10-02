<template>
<core :music="music" :difficulties="difficulties" :albumName="false" :levelDesigner="levelDesigner" :src="src" :hide="true"></core>
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
      const { difficulty1, difficulty2, difficulty3, difficulty4, id } = this.music
      return [difficulty1, difficulty2, difficulty3, difficulty4].map((level, i) => ({ level, link: `/mdmc/chart/${id}/${i}` }))
    },
    levelDesigner() {
      const { levelDesigner } = this.music
      const levelDesigners = [levelDesigner]
      return levelDesigners
    }
  }
}
</script>

<style>

</style>
