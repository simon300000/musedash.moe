<template>
<nav class="level">
  <div class="level-left">
    <div class="level-item">
      <figure class="image is-128x128">
        <img class="is-rounded" :src="`/covers/${music.cover}.png`">
      </figure>
    </div>
  </div>
  <div class="level-item"><strong>{{music.name}}</strong></div>
  <div class="level-item">{{music.author}}</div>
  <div class="level-right">
    <div class="level-item">
      <router-link :to="`/music/${music.uid}/0`" class="button is-success is-rounded" v-if="music.difficulty[0]">{{music.difficulty[0]}}</router-link>
      <router-link :to="`/music/${music.uid}/1`" class="button is-info is-rounded" v-if="music.difficulty[1]">{{music.difficulty[1]}}</router-link>
      <router-link :to="`/music/${music.uid}/2`" class="button is-danger is-rounded" v-if="music.difficulty[2]">{{music.difficulty[2]}}</router-link>
    </div>
  </div>
</nav>
</template>

<script>
export default {
  props: ['music']
}
</script>