<template>
<span :class="color">{{sign}}</span>
</template>

<script>
export default {
  props: ['before', 'after'],
  computed: {
    change() {
      return this.before - this.after
    },
    color() {
      if (this.before === -1) {
        return 'has-text-info'
      }
      if (this.change > 0) {
        return 'has-text-success'
      }
      if (this.change < 0) {
        return 'has-text-danger'
      }
      return ''
    },
    sign() {
      if (this.before === -1) {
        return 'New!'
      }
      if (this.change > 0) {
        return `+${this.change}`
      }
      return this.change
    }
  }
}
</script>
