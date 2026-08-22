import { run } from './spider.js'

import { start as mdmc } from './mdmc.js'

import { isCurrentWorkerRole, startWorker } from './worker.js'
import './diffdiff.js'
import './api.js'

if (isCurrentWorkerRole('master')) {
  console.log('Starting master worker...')
  startWorker(new URL(import.meta.url), 'api')
  startWorker(new URL(import.meta.url), 'diffdiff')
  startWorker(new URL(import.meta.url), 'mdmc')
  run()
}

if (isCurrentWorkerRole('mdmc')) {
  console.log('Starting mdmc worker...')
  mdmc()
}
