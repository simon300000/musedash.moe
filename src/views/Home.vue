<template>
<div>
  <progress class="progress is-small" max="100" v-if="!albumsArray.length"></progress>
  <findMusic v-if="albumsArray.length"></findMusic>

  <div class="tag-container" v-if="albumsArray.length">
    <router-link :to="'/'" custom v-slot="{ navigate, href }">
      <a class="tag-btn tag-all" :href="href" :class="{'tag-btn-selecte': allSelected}" @click="navigate">
        <div class="tag-content-container">
          <img :src="iconSrc('IconAllMusic.png')" class="tag-img" alt="All">
          <span class="tag-text">ALL</span>
        </div>
      </a>
    </router-link>

    <router-link :to="`/tag/${name}`" :key="name" v-for="{name, displayName} in tag" custom v-slot="{ navigate, href, isActive }">
      <a class="tag-btn" :href="href" :class="{'tag-btn-selecte': isActive}" @click="navigate">
        <div class="tag-content-container">
          <img :src="iconSrc(tagImage[name])" class="tag-img" :alt="displayName[lang]">
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
import { useMainStore } from '../stores/main'

import findMusic from '../components/findMusic.vue'
import Albums from '../components/albums.vue'

import IconAllMusic from '../icons/IconAllMusic.png'
import IconDefaultMusic from '../icons/IconDefaultMusic.png'
import IconConceptPack from '../icons/IconConceptPack.png'
import IconHappyOtakuPack from '../icons/IconHappyOtakuPack.png'
import IconCuteIsEveryting from '../icons/IconCuteIsEveryting.png'
import IconGiveUpTreatment from '../icons/IconGiveUpTreatment.png'
import IconHideMap from '../icons/IconHideMap.png'
import IconNew from '../icons/IconNew.png'
import IconJustAsPlanned from '../icons/IconJustAsPlanned.png'
import X from '../icons/X.png'

const tagImage = {
  Default: 'IconDefaultMusic.png',
  Theme: 'IconConceptPack.png',
  Happy: 'IconHappyOtakuPack.png',
  Cute: 'IconCuteIsEveryting.png',
  GiveUp: 'IconGiveUpTreatment.png',
  X: 'X.png',
  HideMap: 'IconHideMap.png',
  New: 'IconNew.png',
  PlannedPlus: 'IconJustAsPlanned.png'
}

const iconUrls = {
  'IconAllMusic.png': IconAllMusic,
  'IconDefaultMusic.png': IconDefaultMusic,
  'IconConceptPack.png': IconConceptPack,
  'IconHappyOtakuPack.png': IconHappyOtakuPack,
  'IconCuteIsEveryting.png': IconCuteIsEveryting,
  'IconGiveUpTreatment.png': IconGiveUpTreatment,
  'IconHideMap.png': IconHideMap,
  'IconNew.png': IconNew,
  'IconJustAsPlanned.png': IconJustAsPlanned,
  'X.png': X
}

export default {
  data() {
    return { tagImage }
  },
  components: { findMusic, Albums },
  computed: {
    lang() { return useMainStore().lang },
    tag() { return useMainStore().tag },
    albumsArray() { return useMainStore().albumsArray },
    allSelected() {
      return !this.$route.path.includes('/tag/')
    }
  },
  serverPrefetch() {
    return useMainStore().loadAlbums()
  },
  mounted() {
    useMainStore().loadAlbums()
  },
  methods: {
    iconSrc(file) {
      return iconUrls[file] || ''
    }
  }
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
