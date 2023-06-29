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
import { mapGetters, mapState, mapMutations } from 'vuex'

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
          this.updateTitle([this, this.tagName])
        }
      }
    }
  },
  beforeDestroy() {
    this.removeTitle(this)
  },
  methods: mapMutations(['removeTitle', 'updateTitle']),
  computed: {
    ...mapState(['fullAlbums', 'lang', 'tag']),
    ...mapGetters(['tagMap']),
    currentTag() {
      return this.tagMap[this.name]
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
