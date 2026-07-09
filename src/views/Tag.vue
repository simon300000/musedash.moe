<template>
<div>
  <br>
  <div v-for="{json, musics} in currentTag" :key="json">
    <p class="album-title">{{fullAlbums[json][lang].title}}</p>
    <Album :album="json" :only="musics"></Album>
    <hr>
  </div>
</div>
</template>

<script>
import { useMainStore } from '../stores/main'

import Album from './Album.vue'

export default {
  props: ['name'],
  components: {
    Album
  },
  watch: {
    tagName: {
      immediate: true,
      handler() {
        if (this.tagName) {
          useMainStore().updateTitle(this, this.tagName)
        }
      }
    }
  },
  beforeUnmount() {
    useMainStore().removeTitle(this)
  },
  computed: {
    fullAlbums() { return useMainStore().fullAlbums },
    lang() { return useMainStore().lang },
    tag() { return useMainStore().tag },
    tagMap() { return useMainStore().tagMap },
    currentTag() {
      const tags = this.tagMap[this.name]
      if (!tags) {
        return []
      }
      return tags.filter(({ json }) => json in this.fullAlbums)
    },
    tagNames() {
      return Object.fromEntries(this.tag.map(({ name, displayName }) => [name, displayName[this.lang]]))
    },
    tagName() {
      return this.tagNames[this.name]
    }
  }
}
</script>

<style scoped>
.album-title {
  text-align: center;
  font-weight: bold;
  font-size: 28px;
}
</style>
