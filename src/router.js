import Vue from 'vue'
import Router from 'vue-router'
import Home from './views/Home.vue'
import Album from './views/Album.vue'
import Music from './views/Music.vue'
import Rank from './views/Rank.vue'
import Player from './views/Player.vue'
import Search from './views/Search.vue'
import About from './views/About.vue'
import D from './views/D.vue'

import MDMC from './views/MDMC.vue'
import MDMCHome from './views/MDMCHome.vue'
import MDMCMusic from './views/MDMCMusic.vue'
import MDMCRank from './views/MDMCRank.vue'
import MDMCPlayer from './views/MDMCPlayer.vue'

Vue.use(Router)

export const createRouter = () => new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      alias: ['/albums', '/music'],
      name: 'home',
      component: Home,
      children: [{
        path: 'albums/:album',
        props: true,
        component: Album
      }]
    }, {
      path: '/music/:uid',
      props: true,
      component: Music,
      children: [{
        path: ':difficulty',
        props: true,
        component: Rank,
        children: [{ path: ':platform', props: true }]
      }]
    }, {
      path: '/player/:id',
      props: true,
      component: Player
    }, {
      path: '/player',
      alias: '/search',
      component: Search
    }, {
      path: '/about',
      component: About
    }, {
      path: '/dd',
      component: D
    }, {
      path: '/mdmc',
      component: MDMC,
      children: [{
        path: '/',
        alias: ['chart'],
        component: MDMCHome
      }, {
        path: 'chart/:id',
        props: true,
        component: MDMCMusic,
        children: [{ path: ':difficulty', props: true, component: MDMCRank }]
      }, {
        path: 'player/:id',
        props: true,
        component: MDMCPlayer
      }, {
        path: 'player',
        props: { mdmc: true },
        component: Search
      }]
    }
  ]
})
