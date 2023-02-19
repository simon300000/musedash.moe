<template>
<div class="canvas">
  <canvas ref="canvas"></canvas>
</div>
</template>

<script>
import {
  Chart,
  TimeScale,
  LineController,
  LinearScale,
  PointElement,
  LineElement,
  Colors,
  Decimation,
  Legend,
  Tooltip
} from 'chart.js'
import 'chartjs-adapter-moment'

import { getDiffHistory } from '@/api'

Chart.register(
  TimeScale,
  LineController,
  LinearScale,
  PointElement,
  LineElement,
  Colors,
  Decimation,
  Legend,
  Tooltip
)

export default {
  props: ['player'],
  async mounted() {
    const data = await getDiffHistory({ id: this.id, start: 0, length: this.diffHistoryNumber })
    const diffData = data.map(({ time, diff }) => ({ x: time, y: diff }))
    this.chart = new Chart(this.$refs.canvas, {
      type: 'line',
      data: {
        datasets: [{
          label: 'R.L.',
          cubicInterpolationMode: 'monotone',
          data: diffData
        }]
      },
      options: {
        parsing: false,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'day'
            }
          }
        }
      }
    })
  },
  computed: {
    diffHistoryNumber() {
      return this.player.diffHistoryNumber
    },
    id() {
      return this.player.user.user_id
    }
  },
  beforeDestroy() {
    this.chart.destroy()
  }
}
</script>

<style scoped>
.canvas {
  height: 320px;
  margin: auto;
}
</style>
