<template>
<div id="app">
  <nav class="navbar" role="navigation" aria-label="main navigation">
    <div class="navbar-menu">
      <div class="navbar-brand">
        <div class="navbar-item">👌</div>
      </div>
      <div class="navbar-start">
        <router-link to="/" class="navbar-item">Home</router-link>
      </div>
      <div class="navbar-end">
        <div class="navbar-item has-dropdown is-hoverable">
          <a class="navbar-link is-arrowless">
            {{currentLang}}
          </a>
          <div class="navbar-dropdown is-right">
            <a class="navbar-item" v-for="[lang, name] in availableLang" :key="name" @click="setLang(lang)">
              {{name}}
            </a>
            <hr class="navbar-divider">
            <router-link to="/about" class="navbar-item">About</router-link>
          </div>
        </div>
      </div>
    </div>
  </nav>
  <router-view></router-view>
</div>
</template>

<script>
import { mapState, mapMutations } from 'vuex'

const langs = {
  ChineseS: '简体中文',
  ChineseT: '繁體中文',
  English: 'English',
  Japanese: '日本語',
  Korean: '한국어'
}

export default {
  computed: {
    ...mapState(['lang']),
    currentLang() {
      return langs[this.lang]
    },
    availableLang() {
      return Object.entries(langs)
        .filter(([lang]) => lang !== this.lang)
    }
  },
  methods: mapMutations(['setLang'])
}
</script>

<style lang="scss">
@import "~bulma/sass/utilities/_all.sass";
@import "~bulma/sass/base/_all.sass";
@import "~bulma/sass/components/navbar.sass";
@import "~bulma/sass/components/tabs.sass";
@import "~bulma/sass/elements/container.sass";
@import "~bulma/sass/layout/section.sass";
@import "~bulma/sass/elements/progress.sass";
</style>
