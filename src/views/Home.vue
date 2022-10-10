<template>
<div>
  <progress class="progress is-small" max="100" v-if="!albumsArray.length"></progress>
  <findMusic v-if="albumsArray.length"></findMusic>

  <div class="tag-container" v-if="albumsArray.length">
    <router-link :to="'/'" custom v-slot="{ navigate, href }">
      <a class="tag-btn tag-all" :href="href" :class="{'tag-btn-selecte': allSelected}" @click="navigate">
        <div class="tag-content-container">
          <img src="@/icons/IconAllMusic.png" class="tag-img" alt="All">
          <span class="tag-text">ALL</span>
        </div>
      </a>
    </router-link>

    <router-link :to="`/tag/${name}`" :key="name" v-for="{name, displayName} in tag" custom v-slot="{ navigate, href, isActive }">
      <a class="tag-btn" :href="href" :class="{'tag-btn-selecte': isActive}" @click="navigate">
        <div class="tag-content-container">
          <img :src="require(`@/icons/${tagImage[name]}`)" class="tag-img" alt="All">
          <span class="tag-text">{{displayName[lang]}}</span>
        </div>
      </a>
    </router-link>

  </div>
  <Albums v-if="allSelected"></Albums>
  <router-view v-if="albumsArray.length"></router-view>
</div>
</template>

<script>
import { mapState, mapActions, mapGetters } from 'vuex'

import findMusic from '@/components/findMusic'
import Albums from '@/components/albums.vue'

export default {
  data() {
    this.tagImage = {
      Default: 'IconDefaultMusic.png',
      Theme: 'IconConceptPack.png',
      Happy: 'IconHappyOtakuPack.png',
      Cute: 'IconCuteIsEveryting.png',
      GiveUp: 'IconGiveUpTreatment.png',
      X: 'X.png',
      New: 'IconNew.png',
      PlannedPlus: 'IconJustAsPlanned.png'
    }
    return {}
  },
  components: { findMusic, Albums },
  computed: {
    ...mapState(['lang', 'tag']),
    ...mapGetters(['albumsArray']),
    allSelected() {
      return !this.$route.path.includes('/tag/')
    }
  },
  serverPrefetch() {
    return this.loadAlbums()
  },
  mounted() {
    if (!this.albumsArray.length) {
      this.loadAlbums()
    }
  },
  methods: mapActions(['loadAlbums'])
}
</script>

<style scoped>
.tag-container {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}

.tag-btn {
  background-color: rgb(113, 189, 244);
  border-radius: 12px;
  height: 67px;
  width: 67px;
  overflow: hidden;
  margin: 4px;
  transition: width 0.3s;
}

.tag-content-container {
  display: flex;
  height: 67px;
  width: 200px;
}

.tag-all {
  background-color: rgb(215, 74, 171);
}

.tag-img {
  height: 67px;
  width: 67px;
}

.tag-text {
  font-weight: bold;
  margin: auto;
  color: black;
  opacity: 0.4;
  font-size: 22px;
  max-width: 133px;
  line-height: 20px;
}

.tag-btn-selecte {
  width: 200px;
}
</style>
