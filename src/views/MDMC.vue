<template>
<router-view></router-view>
</template>

<script>
import { mapMutations } from 'vuex'

export default {
  beforeDestroy() {
    this.removeTitle(this)
  },
  serverPrefetch() {
    this.updateTitle([this, 'MDMC'])
  },
  mounted() {
    this.updateTitle([this, 'MDMC'])
  },
  methods: mapMutations(['removeTitle', 'updateTitle'])
}
</script>
