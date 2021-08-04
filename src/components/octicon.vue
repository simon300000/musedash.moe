<template>
<span v-html="svgBig" class="svgWWW" :style="`height:${this.size}px;width:${this.size}px;position:relative;top:${Number(this.size)/11.3}px;`">
</span>
</template>

<script>
import mobile from '!raw-loader!@/octicons/icons/device-mobile-16.svg'
import desktop from '!raw-loader!@/octicons/icons/device-desktop-16.svg'

export default {
  props: ['type', 'size'],
  computed: {
    svgBig() {
      return this.svg.replace('width="16" height="16" viewBox="0 0 16 16"', `width="${this.size}" height="${this.size}" viewBox="0 0 16 16"`)
    },
    svg() {
      if (this.type === 'mobile') {
        return mobile
      }
      return desktop
    }
  }
}
</script>

<style scoped>
.svgWWW {
  fill: currentColor;
}
</style>
