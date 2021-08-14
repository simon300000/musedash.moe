<template>
<div>
  Not Official
  <p>
    This project/website is unofficial! I have no copyright with the music/picture/cover displayed in the website, they belong to the original owner. This website has no relation with MuseDash or PeroPeroGames.
    <br>
    Please download the game under :D
    <br>
    <br>
    Download the game:
    <br>
    Steam:(PC/macOS) <a href="https://store.steampowered.com/app/774171/Muse_Dash/" target="_blank" rel="noopener noreferrer">https://store.steampowered.com/app/774171/Muse_Dash/</a>
    <br>
    Google Play: <a href="https://play.google.com/store/apps/details?id=com.prpr.musedash" target="_blank" rel="noopener noreferrer">https://play.google.com/store/apps/details?id=com.prpr.musedash</a>
    <br>
    Nintendo Switch: <a href="https://www.nintendo.com/games/detail/muse-dash-switch/" target="_blank" rel="noopener noreferrer">https://www.nintendo.com/games/detail/muse-dash-switch/</a>
    <br>
    Apple App Store: <a href="https://apps.apple.com/us/app/muse-dash/id1361473095" target="_blank" rel="noopener noreferrer">https://apps.apple.com/us/app/muse-dash/id1361473095</a>
    <br>
    TapTap: <a href="https://www.taptap.com/app/60809 " target="_blank" rel="noopener noreferrer">https://www.taptap.com/app/60809 </a>
    <br>
    Twitter:
    <br>
    <a href="https://twitter.com/musedashthegame" target="_blank" rel="noopener noreferrer">Muse Dash</a>
    <br>
    <a href="https://twitter.com/peroperoguys" target="_blank" rel="noopener noreferrer">PeroPeroGames</a>
    <br>
    Website:
    <br>
    <a href="http://www.peroperogames.com" target="_blank" rel="noopener noreferrer">PeroPeroGames</a>
  </p>

  <br> <a href="https://github.com/simon300000/musedash.moe/" target="_blank"><img alt="GitHub stars" src="https://img.shields.io/github/stars/simon300000/musedash.moe.svg?style=social"></a> <br>
  <a href="https://github.com/simon300000/musedash.moe/" target="_blank">simon300000/musedash.moe</a>
  <hr>
  <pre class="log"><code>{{log}}</code></pre>

</div>
</template>

<script>
import { mapMutations } from 'vuex'

import { getLog } from '@/api'

export default {
  data() {
    return {
      log: 'loading...'
    }
  },
  methods: mapMutations(['updateTitle', 'removeTitle']),
  created() {
    this.updateTitle([this, 'About'])
  },
  beforeDestroy() {
    this.removeTitle(this)
  },
  async mounted() {
    this.log = await getLog()
  }
}
</script>

<style scoped>
.log {
  height: 480px;
  overflow-y: auto;
}
</style>
