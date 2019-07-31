<template>
<div id="app">
  <nav class="navbar" role="navigation" aria-label="main navigation">
    <div class="navbar-menu">
      <div class="navbar-brand">
        <div class="navbar-item">👌</div>
      </div>
      <div class="navbar-start">
        <router-link to="/" class="navbar-item">Home</router-link>
      </div>
    </div>
  </nav>
  <router-view></router-view>
</div>
</template>

<script>
export default {}
</script>

<style lang="scss">
@import "~bulma/sass/utilities/_all.sass";
@import "~bulma/sass/base/_all.sass";
@import "~bulma/sass/components/navbar.sass";
@import "~bulma/sass/components/tabs.sass";
@import "~bulma/sass/elements/container.sass";
@import "~bulma/sass/layout/section.sass";
@import "~bulma/sass/elements/progress.sass";
</style>
