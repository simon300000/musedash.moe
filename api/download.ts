import got from 'got'

import { Job, RawAPI } from './type.js'

import { HTTP_PARALLEL } from './config.js'

const jobs: Job[] = []
let running = 0

const next = async () => {
  if (running < HTTP_PARALLEL) {
    running++
    while (jobs.length) {
      const { url, resolve, reject } = jobs.shift()
      await got(url, { timeout: 1000 * 10 }).json<RawAPI>().then(resolve).catch(reject)
    }
    running--
  }
}

export const down = (url: string) => new Promise<RawAPI>((resolve, reject) => {
  jobs.unshift({ url, resolve, reject })
  next()
})
