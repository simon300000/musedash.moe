<template functional>
<nav class="level">
  <div class="level-item">
    <figure class="image is-128x128">
      <img class="is-rounded" :src="props.src" :alt="props.src">
    </figure>
  </div>
  <div class="level-item">
    <div>
      <p class="title is-3 is-spaced"><span v-html="props.name"></span> <span class="subtitle is-6">Lv.{{props.lv}}</span></p>
      <p class="subtitle is-5 is-spaced">{{props.author}}</p>
    </div>
  </div>
  <div class="level-item">
    <div>
      <p class="title is-3 is-spaced">{{Math.round(props.play.acc*10)/10}}%</p>
      <p class="subtitle is-5 is-spaced">{{props.play.score}}</p>
      <p class="subtitle is-6 is-spaced">{{props.character}} / {{props.elfin}}</p>
    </div>
  </div>
  <div class="level-item">
    <div>
      <router-link :to="props.link">
        <p class="title is-3 is-spaced clickable">
          <template v-if="props.play.platform">
            <octicon v-if="props.play.platform === 'pc'" type="desktop" size="26"></octicon>
            <octicon v-else type="mobile" size="26"></octicon>
          </template>
          #{{props.play.i+1}}
        </p>
      </router-link>
      <router-link :to="props.sumLink" v-if="props.sumLink">
        <p class="subtitle is-6 is-spaced clickable">sum #{{props.play.sum+1}}</p>
      </router-link>
      <slot></slot>
    </div>
  </div>
</nav>
</template>

<script>
export default {
  props: ['play', 'src', 'name', 'author', 'lv', 'link', 'sumLink', 'elfin', 'character']
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
