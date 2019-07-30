<template>
<div class="home">
  <test />
</div>
</template>

<script>
import test from '@/components/test'
import { getAlbums } from '../api'
export default {
  components: {
    test
  },
  mounted() {
    getAlbums()
      .then(console.log)
  }
}
</script>
