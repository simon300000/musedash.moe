<template>
<div id="app" :class="{ blackWhite }">
  <link rel="stylesheet" :href="currentTheme.css">
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
        <router-link to="/player" class="navbar-item" :exact-active-class="'is-active'">Search</router-link>
        <router-link to="/mdmc" class="navbar-item mdmcPink" :active-class="'is-active'">mdmc</router-link>
        <router-link to="/rd" class="navbar-item" :active-class="'is-active'">R. Difficulty</router-link>
        <p class="navbar-item">Sorry for the late update!</p>
      </div>

      <div class="navbar-end">
        <a class="navbar-item" @click.prevent="setTheme(currentTheme.next)" :href="`?theme=${currentTheme.next}`">{{currentTheme.button}}</a>
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
              <router-link to="/about" class="navbar-item">About</router-link>
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

import dark from '!file-loader?name=static/css/[name].noinject.hash.[contenthash].css!sass-loader!./dark.scss'
import light from '!file-loader?name=static/css/[name].noinject.hash.[contenthash].css!sass-loader!./bulma.scss'
import auto from '!file-loader?name=static/css/[name].noinject.hash.[contenthash].css!sass-loader!./auto.scss'

import { dispatch, receipt } from '@/api'

const wait = ms => new Promise(resolve => setTimeout(resolve, ms))

const themeConfig = {
  dark: {
    css: dark,
    next: 'light',
    button: '🌙'
  },
  light: {
    css: light,
    next: 'auto',
    button: '💡'
  },
  auto: {
    css: auto,
    next: 'dark',
    button: 'Auto'
  }
}

const langs = {
  ChineseS: '简体中文',
  ChineseT: '繁體中文',
  English: 'English',
  Japanese: '日本語',
  Korean: '한국어'
}

const preventDefault = e => {
  // don't redirect with control keys
  if (e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) return false
  // don't redirect when preventDefault called
  if (e.defaultPrevented) return false
  // don't redirect on right click
  if (e.button !== undefined && e.button !== 0) return false
  // https://github.com/vuejs/vue-router/blob/65de048ee9f0ebf899ae99c82b71ad397727e55d/src/components/link.js#L159-L164
  e.preventDefault()
  return true
}

export default {
  data() {
    return { menu: false }
  },
  components: {
    CapsuleDef
  },
  async mounted() {
    this.$gtag.config({
      custom_map: {
        dimension1: 'theme',
        dimension2: 'code'
      }
    })
    this.$gtag.event('theme', {
      'theme': this.theme
    })
    if (localStorage.noSpider !== 'true') {
      while (true) {
        const { url } = await dispatch()
        if (url) {
          const data = await fetch(url).then(w => w.text())
          receipt(url, data)
          this.$gtag.event('Dispatch', {
            event_name: 'dispatch',
            code: JSON.parse(data).code
          })
        } else {
          await wait(1000 * 20)
        }
        await wait(1000 * 10)
      }
    }
  },
  watch: {
    theme: {
      immediate: false,
      handler() {
        this.$gtag.event('theme', {
          'theme': this.theme
        })
      }
    }
  },
  computed: {
    ...mapState(['lang', 'theme', 'blackWhite']),
    currentLang() {
      return langs[this.lang]
    },
    availableLang() {
      return Object.entries(langs)
        .filter(([lang]) => lang !== this.lang)
    },
    currentTheme() {
      return themeConfig[this.theme] || themeConfig.dark
    }
  },
  created() {
    this.updateTitle([this, 'MuseDash.moe - Rank of Muse Dash'])
  },
  methods: {
    ...mapMutations(['setLang', 'setTheme', 'updateTitle']),
    updateLang(lang, e) {
      if (preventDefault(e)) {
        this.setLang(lang)
        this.$router.push({ query: { lang } })
      }
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

<style scoped>
.def {
  position: absolute;
  top: -1000px;
}

.mdmcPink:hover {
  color: #ff55c3;
}

.mdmcPink.is-active {
  color: #ff55c3;
}

.blackWhite {
  filter: grayscale(100%);
}

.anniversary {
  transition: font-size 0.8s ease;
}

.anniversary-rainbow {
  background: linear-gradient(to right, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #8f00ff, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #8f00ff, #ff0000);
  background-clip: text;
  -webkit-background-clip: text;
  animation: rainbow_animation 4s linear infinite;
  background-size: 200% 100%;
  transition: color 0.8s ease;
}

@keyframes rainbow_animation {
  0% {
    background-position: 0% 0;
  }

  100% {
    background-position: 100% 0;
  }
}

.anniversary:hover {
  font-size: 50px;
}

.anniversary-rainbow:hover {
  color: transparent;
}
</style>
