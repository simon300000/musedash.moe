<template>
<div>
  Not Official
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
