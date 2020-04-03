<template>
<nav class="level">
  <div class="level-left">
    <div class="level-item">
      <figure class="image is-128x128">
        <img class="is-rounded" :src="`/covers/${music.cover}.png`">
      </figure>
    </div>
  </div>
  <div class="level-item">
    <div>
      <p class="title is-5 is-spaced">{{music.name}}</p>
      <p class="subtitle is-6" title="Author">{{music.author}}</p>
    </div>
  </div>
  <div class="level-item">
    <div>
      <p class="title is-6 is-spaced" title="Level Designer" v-for="(designer, i) in music.levelDesigner" :key="`${music.name}_${i}`">{{designer}}</p>
    </div>
  </div>
  <div class="level-right">
    <div class="level-item">
      <router-link :to="`/music/${music.uid}/0${this.platform ? `/${this.platform}` : ''}`" active-class="is-hovered" class="button is-success is-rounded is-outlined" v-if="music.difficulty[0] !== '0'">{{music.difficulty[0]}}</router-link>
      <router-link :to="`/music/${music.uid}/1${this.platform ? `/${this.platform}` : ''}`" active-class="is-hovered" class="button is-info is-rounded is-outlined" v-if="music.difficulty[1] !== '0'">{{music.difficulty[1]}}</router-link>
      <router-link :to="`/music/${music.uid}/2${this.platform ? `/${this.platform}` : ''}`" active-class="is-hovered" class="button is-danger is-rounded is-outlined" v-if="music.difficulty[2] !== '0'">{{music.difficulty[2]}}</router-link>
      <router-link :to="`/music/${music.uid}/3${this.platform ? `/${this.platform}` : ''}`" active-class="is-hovered" class="button is-dark is-rounded is-outlined" v-if="music.difficulty[3] !== '0'">{{music.difficulty[3]}}</router-link>
    </div>
  </div>
</nav>
</template>

<script>
export default {
  props: ['music', 'platform']
}
</script>
