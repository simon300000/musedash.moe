<template functional>
<nav class="level">
  <div class="level-left">
    <div class="level-item">
      <figure class="image is-128x128">
        <img class="is-rounded" :src="props.src" :alt="props.src">
      </figure>
    </div>
  </div>
  <div class="level-item">
    <div>
      <p class="title is-5 is-spaced" v-html="props.music.name"></p>
      <p class="subtitle is-6" title="Author">{{props.music.author}}</p>
      <router-link :to="props.albumLink" v-if="props.albumName">
        <p class="subtitle is-6 clickable">「{{props.albumName}}」</p>
      </router-link>
    </div>
  </div>
  <div class="level-item">
    <div>
      <p class="title is-6 is-spaced" title="Level Designer" v-for="(designer, i) in props.levelDesigner" :key="`${props.music.name}_${i}`">{{designer}}</p>
    </div>
  </div>
  <div class="level-right">
    <capsule :difficulties="props.difficulties" :hide="props.hide"></capsule>
  </div>
</nav>
</template>
