import Vue from 'vue'
import { Loading } from 'element-ui'

Vue.use(Loading.directive)
Vue.prototype.$loading = Loading.service
