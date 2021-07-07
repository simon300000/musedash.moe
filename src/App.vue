<template>
<div id="app">
  <link rel="stylesheet" :href="themeCss">
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
        <a class="navbar-item" @click="switchTheme()">{{otherTheme}}</a>
        <div class="navbar-end">
          <div class="navbar-item has-dropdown is-hoverable" :class="{'is-active': menu}">
            <a class="navbar-link is-arrowless" @click="switchMenu">
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
  <CapsuleDef class="def"></CapsuleDef>
</div>
</template>

<script>
import { mapState, mapMutations } from 'vuex'
import CapsuleDef from '@/components/capsule-def'

// eslint-disable-next-line import/no-webpack-loader-syntax
import dark from '!file-loader?name=static/css/[name].[contenthash].css!sass-loader!./dark.scss'
// eslint-disable-next-line import/no-webpack-loader-syntax
import light from '!file-loader?name=static/css/[name].[contenthash].css!sass-loader!./bulma.scss'

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
  components: {
    CapsuleDef
  },
  mounted() {
    this.ha = new Date().getMonth() + 1 === 4 && new Date().getDate() === 1
  },
  computed: {
    ...mapState(['lang', 'theme']),
    currentLang() {
      return langs[this.lang]
    },
    availableLang() {
      return Object.entries(langs)
        .filter(([lang]) => lang !== this.lang)
    },
    themeCss() {
      return this.theme === 'dark' ? dark : light
    },
    otherTheme() {
      return this.theme === 'dark' ? '💡' : '🌙'
    }
  },
  created() {
    this.updateTitle([this, 'MuseDash.moe'])
  },
  methods: {
    ...mapMutations(['setLang', 'setTheme', 'updateTitle']),
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
    },
    switchTheme() {
      if (this.theme === 'dark') {
        this.setTheme('light')
      } else {
        this.setTheme('dark')
      }
    }
  }
}
</script>

<style scoped>
.def {
  position: absolute;
  top: -1000px;
}
</style>
