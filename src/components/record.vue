<template>
<nav class="level">
  <div class="level-item">
    <figure class="image is-128x128">
      <img class="is-rounded" :src="src" :alt="src">
    </figure>
  </div>
  <div class="level-item">
    <div>
      <p class="title is-3 is-spaced"><span v-html="name"></span> <span class="subtitle is-6">Lv.{{lv}}</span></p>
      <p class="subtitle is-5 is-spaced">{{author}}</p>
    </div>
  </div>
  <div class="level-item">
    <div>
      <p class="title is-3 is-spaced">{{Math.round(play.acc*100)/100}}%</p>
      <p class="subtitle is-5 is-spaced">{{play.score}}</p>
      <p class="subtitle is-6 is-spaced">{{character}} / {{elfin}}</p>
    </div>
  </div>
  <div class="level-item">
    <div>
      <router-link :to="link">
        <p class="title is-3 is-spaced clickable">
          <template v-if="play.platform">
            <octicon v-if="play.platform === 'pc'" type="desktop" size="26"></octicon>
            <octicon v-else type="mobile" size="26"></octicon>
          </template>
          #{{play.i+1}}
        </p>
      </router-link>
      <router-link :to="sumLink" v-if="sumLink">
        <p class="subtitle is-6 is-spaced clickable">sum #{{play.sum+1}}</p>
      </router-link>
      <slot></slot>
    </div>
  </div>
</nav>
</template>

<script>
import Octicon from '../components/octicon.vue'

export default {
  props: ['play', 'src', 'name', 'author', 'lv', 'link', 'sumLink', 'elfin', 'character'],
  components: { Octicon }
}
</script>

<style scoped>
.clickable {
  cursor: pointer;
}

.level-item {
  flex: 1;
}

.level-item:nth-child(2) {
  flex: 2;
}
</style>
