<template>
<div id="app">
  <nav class="navbar" role="navigation" aria-label="main navigation">
    <div class="navbar-brand">
      <div class="navbar-brand">
        <router-link to="/" class="navbar-item">MuseDash.moe</router-link>
      </div>

      <a role="button" class="navbar-burger burger" :class="{'is-active': menu}" aria-label="menu" @click="switchMenu" aria-expanded="false">
        <span aria-hidden="true"></span>
        <span aria-hidden="true"></span>
        <span aria-hidden="true"></span>
      </a>
    </div>

    <div class="navbar-menu" :class="{'is-active': menu}">
      <div class="navbar-start" @click="closeMenu()">
        <router-link to="/player" class="navbar-item">{{ha?'Suche':'Search'}}</router-link>
      </div>

      <div class="navbar-end">
        <div class="navbar-end">
          <div class="navbar-item has-dropdown is-hoverable">
            <a class="navbar-link is-arrowless">
              {{currentLang}}
            </a>
            <div class="navbar-dropdown is-right" @click="closeMenu()">
              <a class="navbar-item" v-for="[lang, name] in availableLang" :href="`?lang=${lang}`" :key="name" @click="updateLang(lang, $event)">
                {{name}}
              </a>
              <hr class="navbar-divider">
              <router-link to="/about" class="navbar-item">{{ha?'Über uns':'About'}}</router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </nav>
  <section class="section" @click="closeMenu">
    <div class="container">
      <router-view></router-view>
    </div>
  </section>
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
  data() {
    return { ha: false, menu: false }
  },
  mounted() {
    this.ha = new Date().getMonth() + 1 === 4 && new Date().getDate() === 1
  },
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
  created() {
    this.updateTitle([this, 'MuseDash.moe'])
  },
  methods: {
    ...mapMutations(['setLang', 'updateTitle']),
    updateLang(lang, e) {
      // don't redirect with control keys
      if (e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) return
      // don't redirect when preventDefault called
      if (e.defaultPrevented) return
      // don't redirect on right click
      if (e.button !== undefined && e.button !== 0) return
      // https://github.com/vuejs/vue-router/blob/65de048ee9f0ebf899ae99c82b71ad397727e55d/src/components/link.js#L159-L164
      e.preventDefault()

      this.setLang(lang)
      this.$router.push({ query: { lang } })
    },
    switchMenu() {
      this.menu = !this.menu
    },
    closeMenu() {
      this.menu = false
    }
  }
}
</script>

<style lang="scss">
// @import "~bulma/bulma.sass";
@import "~bulma/sass/utilities/_all.sass";
@import "~bulma/sass/base/_all.sass";
@import "~bulma/sass/helpers/color.sass";
@import "~bulma/sass/components/navbar.sass";
@import "~bulma/sass/components/tabs.sass";
@import "~bulma/sass/elements/container.sass";
@import "~bulma/sass/layout/section.sass";
@import "~bulma/sass/elements/progress.sass";
@import "~bulma/sass/components/level.sass";
@import "~bulma/sass/elements/image.sass";
@import "~bulma/sass/elements/button.sass";
@import "~bulma/sass/elements/table.sass";
@import "~bulma/sass/elements/icon.sass";
@import "~bulma/sass/layout/hero.sass";
@import "~bulma/sass/elements/title.sass";
@import "~bulma/sass/form/shared.sass";
@import "~bulma/sass/form/tools.sass";
@import "~bulma/sass/form/input-textarea.sass";
</style>
