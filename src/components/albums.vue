<template>
<div class="tabs is-centered is-large" ref="container" :class="{overflowhide: win}">
  <ul>
    <router-link :to="`/albums/${album.json}`" :key="album.json" v-for="album in albums" custom v-slot="{ navigate, href, isActive }">
      <li @click="navigate" @keypress.enter="navigate" :class="{ 'is-active': isActive }"><a :href="href"><span>{{album.title}}</span></a></li>
    </router-link>
  </ul>
</div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'

const onScroll = container => e => {
  const d = e.deltaY + e.deltaX
  container.scrollLeft += d
  e.preventDefault()
}

export default {
  data() {
    return {
      win: true,
      scrollEventListner: undefined
    }
  },
  computed: {
    ...mapState(['lang']),
    ...mapGetters(['albumsArray']),
    albums() {
      return this.albumsArray.map(album => ({ title: album.title, json: album.json, ...(album[this.lang] || {}) }))
    }
  },
  mounted() {
    this.win = navigator.appVersion.includes('Win')
    const { container } = this.$refs
    this.scrollEventListner = onScroll(container)
    container.addEventListener('wheel', this.scrollEventListner)
  },
  beforeDestroy() {
    const { container } = this.$refs
    container.removeEventListener('wheel', this.scrollEventListner)
  },

}
</script>

<style scoped>
.overflowhide::-webkit-scrollbar {
  display: none;
}
</style>
