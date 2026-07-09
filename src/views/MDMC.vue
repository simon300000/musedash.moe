<template>
<router-view></router-view>
</template>

<script>
import { useMainStore } from '../stores/main'

export default {
  beforeUnmount() {
    useMainStore().removeTitle(this)
  },
  serverPrefetch() {
    useMainStore().updateTitle(this, 'MDMC')
  },
  mounted() {
    useMainStore().updateTitle(this, 'MDMC')
  }
}
</script>
