import Vue from 'vue'
import Router from 'vue-router'
import Home from './views/Home.vue'
import Album from './views/Album.vue'
import About from './views/About.vue'

Vue.use(Router)

export const createRouter = () => new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      alias: '/albums',
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
      path: '/about',
      component: About
    }
  ]
})
