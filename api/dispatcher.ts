import { Agent, fetch as f, setGlobalDispatcher } from 'undici'

import { wait } from './common.js'

setGlobalDispatcher(new Agent({ connect: { timeout: 120_000 } }))

type Job = {
  url: string
  p: (data: unknown) => void
}

let jobs: Job[] = []

export const fetch = async (url: string) => {
  if (url.includes('music_tag')) {
    return f(url).then(res => res.json())
  }
  const promise = new Promise<unknown>(resolve => jobs.push({ url, p: resolve }))
  return promise
}

export const dispatch = () => jobs[Math.floor(Math.random() * jobs.length)]?.url
export const dispatch256 = (i = 0) => jobs.filter((_, i) => i >= i * 256).filter((_, i) => i < 256).map(job => job.url)

export const receipt = (url: string, data: any) => {
  if (data.code === 0) {
    jobs = jobs.filter(job => {
      if (job.url === url) {
        job.p(data)
        return false
      }
      return true
    })
    console.log('queue count', jobs.length)
    return true
  }
  return false
}

const down = async () => {
  const url = dispatch()
  if (url) {
    const res = await f(url)
    const data = await res.json() as any
    receipt(url, data)
  }
}

  ;

(async () => {
  while (true) {
    await wait(1000 * 30)
    for (let index = 0; index < 30; index++) {
      down()
    }
  }
})()
