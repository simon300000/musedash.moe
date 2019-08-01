import Vue from 'vue'
import Router from 'vue-router'
import Home from './views/Home.vue'
import Album from './views/Album.vue'
import Music from './views/Music.vue'
import Rank from './views/Rank.vue'
import About from './views/About.vue'

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
      children: [
        {
          path: 'albums/:album',
          props: true,
          component: Album
        }
      ]
    },
    {
      path: '/music/:uid',
      props: true,
      component: Music
    },
    {
      path: '/about',
      component: About
    }
  ]
})
