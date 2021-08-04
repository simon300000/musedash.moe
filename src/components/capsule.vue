<!-- From AbnerSquared, https://codepen.io/AbnerSquared/pen/xxZYEKv -->
<!-- Also capsule-def.vue-->
<template functional>
<div class="level-item">
  <div class="capsule">

    <router-link :to="props.difficulties[0].link" v-if="props.difficulties[0].level !== '0'">
      <svg class="node">
        <use href="#round" fill="url(#white-slash)" class="only" />
        <use href="#star" fill="url(#easy_slash)" />
        <text x="50%" y="50%" class="easy_text text outline_easy">{{props.difficulties[0].level}}</text>
      </svg>
    </router-link>
    <div class="empty node" v-else>
      <div class="dot"></div>
    </div>

    <div class="padding"></div>

    <router-link :to="props.difficulties[1].link" v-if="props.difficulties[1].level !== '0'">
      <svg class="node">
        <use href="#round" fill="url(#white-slash)" class="only" />
        <use href="#star" fill="url(#hard_slash)" />
        <text x="50%" y="50%" class="hard_text text outline_hard">{{props.difficulties[1].level}}</text>
      </svg>
    </router-link>
    <div class="empty node" v-else>
      <div class="dot"></div>
    </div>

    <div class="padding"></div>

    <router-link :to="props.difficulties[2].link" v-if="props.difficulties[2].level !== '0'">
      <svg class="node">
        <use href="#round" fill="url(#white-slash)" class="only" />
        <use href="#star" fill="url(#master_slash)" />
        <text x="50%" y="50%" class="master_text text outline_master">{{props.difficulties[2].level}}</text>
      </svg>
    </router-link>
    <div class="empty node" v-else>
      <div class="dot"></div>
    </div>

    <template v-if="props.difficulties[3].level !== '0'">
      <div class="padding"></div>
      <router-link :to="props.difficulties[3].link">
        <svg class="node">
          <use href="#round" fill="url(#white-slash)" class="only" />
          <use href="#star" fill="url(#inferno_slash)" />
          <text x="50%" y="50%" class="inferno_text text outline_inferno">{{props.difficulties[3].level}}</text>
        </svg>
      </router-link>
    </template>

  </div>
</div>
</template>

<script>
export default {}
</script>

<style scoped>
@font-face {
  font-family: "Impact-face";
  src: url(../Impact.ttf) format("truetype");
}

.only {
  opacity: 0;
}

.router-link-active>.node>.only {
  opacity: 1;
}

.capsule {
  display: inline-block;
  background-color: #27184D;
  text-align: center;
  padding: 16px;
  margin: 16px;
  width: auto;
  height: 80px;
  border-radius: 48px;
  user-select: none;
  -ms-user-select: none;
  -webkit-user-select: none;
}

.node {
  display: block;
  width: 48px;
  height: 48px;
  float: left;
}

.empty {
  background-color: #1E0937;
  border-radius: 50%;
}

.node .dot {
  width: 12px;
  height: 12px;
  margin: 18px;
  border-radius: 50%;
  background-color: #331754;
}

.text {
  z-index: 2;
  text-align: center;
  font-family: Impact, "Impact-face";
  font-size: 24px;
  dominant-baseline: central;
  text-anchor: middle;
}

.outline_easy {
  text-shadow:
    #6DFD64 -2px -2px,
    #6DFD64 0 -2px,
    #6DFD64 2px -2px,
    #6DFD64 2px 0,
    #6DFD64 2px 2px,
    #6DFD64 0 2px,
    #6DFD64 -2px 2px,
    #6DFD64 -2px 0
}

.outline_hard {
  text-shadow:
    #00DCD4 -2px -2px,
    #00DCD4 0 -2px,
    #00DCD4 2px -2px,
    #00DCD4 2px 0,
    #00DCD4 2px 2px,
    #00DCD4 0 2px,
    #00DCD4 -2px 2px,
    #00DCD4 -2px 0
}

.outline_master {
  text-shadow:
    #FF37D9 -2px -2px,
    #FF37D9 0 -2px,
    #FF37D9 2px -2px,
    #FF37D9 2px 0,
    #FF37D9 2px 2px,
    #FF37D9 0 2px,
    #FF37D9 -2px 2px,
    #FF37D9 -2px 0;
}

.outline_inferno {
  text-shadow:
    #3a3a3a -2px -2px,
    #3a3a3a 0 -2px,
    #3a3a3a 2px -2px,
    #3a3a3a 2px 0,
    #3a3a3a 2px 2px,
    #3a3a3a 0 2px,
    #3a3a3a -2px 2px,
    #3a3a3a -2px 0;
}

.easy_text {
  fill: #346460;
}

.hard_text {
  fill: #41548D;
}

.master_text {
  fill: #5B1787;
}

.inferno_text {
  fill: #7e7e7e;
}

.capsule .padding {
  width: 16px;
  height: 100%;
  display: inline-block;
  float: left;
  background-color: transparent;
}
</style>
