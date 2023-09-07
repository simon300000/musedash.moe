import { platforms, wait } from './common.js'
import { APIResult, RankKey, RawAPI } from './type.js'

type Job = {
  key: RankKey
  p: (data: APIResult[]) => void
}

let jobs: Job[] = []

export const downloadCore = async (key: RankKey) => {
  const promise = new Promise<APIResult[]>(resolve => jobs.push({ key, p: resolve }))
  return promise
}

const down = async <T>(url: string) => {
  const result = await fetch(url).then(w => w.json())
  return result as T
}

export const download = async ({ uid, difficulty, platform }: RankKey) => {
  const api = platforms[platform]
  const { result: firstPage, total, code, msg } = await down<RawAPI>(`https://prpr-muse-dash.peropero.net/musedash/v1/${api}/top?music_uid=${uid}&music_difficulty=${difficulty + 1}&limit=100&offset=0&version=2.11.0&platform=musedash.moe`) //platform=ios_overseas
  if (code !== 0) {
    console.error(`Error: ${msg}`)
    throw new Error(msg)
  }
  const pageNumber = Math.max(Math.ceil(total / 100) - 1, 0)
  const urls = Array(pageNumber).fill(undefined).map((_, i) => i + 1).map(i => i * 100 - 1).map(limit => `https://prpr-muse-dash.peropero.net/musedash/v1/${api}/top?music_uid=${uid}&music_difficulty=${difficulty + 1}&limit=${limit}&offset=1&version=2.11.0&platform=musedash.moe`)
  return [firstPage, ...await Promise.all(urls.map(url => down<RawAPI>(url).then(({ result }) => result)))]
    .flat()
    .filter(r => r?.play?.score != undefined && r?.user?.user_id != undefined)
    .filter(r => r.play.acc <= 100)
}

export const dispatch = () => jobs[Math.floor(Math.random() * jobs.length)]?.key

export const receipt = (key: RankKey, data: APIResult[]) => {
  if (Array.isArray(data)) {
    jobs = jobs.filter(job => {
      if (job.key === key) {
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

  ;

(async () => {
  while (true) {
    const key = dispatch()
    if (key) {
      const data = await download(key).catch(() => { })
      if (data) {
        receipt(key, data)
      }
    }
    await wait(1000 * 10)
  }
})()
