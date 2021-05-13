/* eslint camelcase: ["off"] */
import { APIResults, MusicData, MusicCore, RankCore } from './type.js'
import { rank, player, search } from './database.js'
import { PARALLEL } from './config.js'

import { musics } from './albumParser.js'

import got from 'got'

import { log, error, reloadAlbums } from './api.js'

const wait = (ms: number): Promise<undefined> => new Promise(resolve => setTimeout(resolve, ms))

const parallel = async <T>(n: number, pfs: (() => Promise<(number) => T>)[]) => {
  const ws = new Set<() => Promise<(number) => T>>()
  const ps: Promise<T>[] = []
  const epfs = pfs.map(w => async () => {
    ws.add(w)
    const l = await w()
    ws.delete(w)
    const result = l(ws.size + epfs.length)
    if (ws.size < n && epfs.length) {
      const p = epfs.shift()()
      ps.push(p)
      await p
    }
    return result
  })
  for (let i = 0; i < n && epfs.length; i++) {
    ps.push(epfs.shift()())
  }
  await Promise.all(ps)
  return Promise.all(ps)
}

const platforms = {
  mobile: 'leaderboard',
  pc: 'pcleaderboard'
} as const

const downloadCore = async ({ api, uid, difficulty }): Promise<APIResults | void> => (await got(`https://prpr-muse-dash.leanapp.cn/musedash/v1/${api}/top?music_uid=${uid}&music_difficulty=${difficulty + 1}&limit=1999`, { timeout: 1000 * 60 * 10 }).json() as any).result

const download = async ({ api, uid, difficulty, i = 3 }): Promise<APIResults> => {
  const result = await downloadCore({ api, uid, difficulty }).catch((): APIResults => undefined)
  if (!result) {
    if (i >= 0) {
      error(`RETRY: ${uid} - ${difficulty} - ${api}, ${i}`)
      await wait(1000 * 60 * Math.random())
      return download({ api, uid, difficulty, i: i - 1 })
    } else {
      error(`NO: ${uid} - ${difficulty} - ${api}`)
    }
  } else {
    return result.filter(({ play, user }) => play && user)
  }
}

const core = ({ uid, difficulty, platform, api }: RankCore) => async () => {
  const result = await download({ uid, difficulty, api })

  const currentUidRank: string[] = (await rank.get({ uid, difficulty, platform }) || []).map(({ play }) => play.user_id)

  const resultWithHistory = result.map(r => {
    if (currentUidRank.length) {
      return { ...r, history: { lastRank: currentUidRank.indexOf(r.play.user_id) } }
    } else {
      return r
    }
  })

  await rank.put({ uid, difficulty, platform, value: resultWithHistory })
}

const sum = async ({ uid, difficulty }: MusicCore) => {
  const [currentRank, result] = [await rank.get({ uid, difficulty, platform: 'all' }), (await Promise.all(Object.keys(platforms).map(async platform => (await rank.get({ uid, difficulty, platform })).map(play => ({ ...play, platform })))))
    .flat()
    .sort((a, b) => b.play.score - a.play.score)]
  if (currentRank) {
    for (let i = 0; i < result.length; i++) {
      result[i].history = { lastRank: currentRank.findIndex(play => play.platform === result[i].platform && play.user.user_id === result[i].user.user_id) }
    }
  }
  return rank.put({ uid, difficulty, platform: 'all', value: result })
}

const prepare = (music: MusicData) => {
  const { uid, difficulty: difficulties, name } = music
  const dfs = difficulties.map((difficultyNum, difficulty) => {
    if (difficultyNum !== '0') {
      const musicData = Object.entries(platforms)
        .map(([platform, api]) => ({ uid, difficulty, api, platform }))
      return () => Promise.all(musicData.map(core).map(w => w()))
        .then(() => sum({ uid, difficulty }))
        .then(() => musicData)
    }
  }).filter(Boolean)
  return () => Promise.all(dfs.map(w => w())).then(datas => (i: number) => {
    log(`${uid}: ${name} / ${i}`)
    return datas.flat() as RankCore[]
  })
}

const analyze = (musicList: RankCore[]) => musicList
  .reduce(async (p, { uid, difficulty, platform }) => {
    await p
    const currentRank = await rank.get({ uid, difficulty, platform })
    const sumRank = await rank.get({ uid, difficulty, platform: 'all' })
    return (await currentRank
      .map(async ({ user, play: { score, acc }, history }, i) => {
        let playerData = await player.get(user.user_id).catch(() => ({ plays: [] }))
        playerData.user = user
        const sumI = sumRank.findIndex(play => play.platform === platform && play.user.user_id === user.user_id)
        playerData.plays.push({ score, acc, i, platform, history, difficulty, uid, sum: sumI })
        return { key: user.user_id, value: playerData }
      })
      .reduce(async (b, v) => {
        const { key, value } = await v
        const batch = await b
        return batch.put(key, value)
      }, player.batch()))
      .write()
  }, player.clear())

const makeSearch = () => new Promise(async resolve => {
  await search.clear()
  log('Search cleared')
  const batch = search.batch()
  const stream = player.createValueStream()
  stream.on('data', ({ user: { nickname, user_id } }) => batch.put(user_id, nickname.toLowerCase()))
  stream.on('close', () => resolve(batch.write()))
})

const mal = async () => {
  log('Start!')
  const musicList = [(await musics())[0]]
  const pfs = musicList.map(prepare)
  const datass = await parallel(PARALLEL, pfs)
  log('Downloaded')
  await analyze(datass.flat())
  log('Analyzed')
  await makeSearch()
  log('Search Cached')
  await reloadAlbums()
}

export const run = async () => {
  log('hi~')
  await mal()
  while (true) {
    const currentHour = new Date().getUTCHours()
    const waitTime = (19 - currentHour + 24) % 24 || 24
    log(`WAIT: ${waitTime}h`)
    await wait(waitTime * 60 * 60 * 1000)
    const startTime = Date.now()
    await mal()
    const endTime = Date.now()
    log(`TAKE ${endTime - startTime}, at ${new Date().toString()}`)
  }
}
