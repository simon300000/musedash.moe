/* eslint camelcase: ["off"] */
import { Musics, APIResults } from './type'

import got = require('got')

const INTERVAL = 1000 * 60 * 60 * 24

const wait = (ms: number): Promise<undefined> => new Promise(resolve => setTimeout(resolve, ms))

const platforms = {
  mobile: 'leaderboard',
  pc: 'pcleaderboard'
}

const download = async ({ api, uid, difficulty }): Promise<APIResults> => (await got(`https://prpr-muse-dash.leanapp.cn/musedash/v1/${api}/top?music_uid=${uid}&music_difficulty=${difficulty + 1}&limit=1999`, { json: true, timeout: 1000 * 60 * 10 })).body.result

const prepare = (music: Musics) => music
  .flatMap(({ uid, difficulty, name }) => difficulty
    .map((difficultyNum, difficulty) => ({ uid, level: difficultyNum, difficulty, name })))
  .flatMap(({ uid, difficulty, name, level }) => Object.entries(platforms)
    .map(([platform, api]) => ({ uid, difficulty, name, level, platform, api })))
  .filter(({ level }) => level)

const core = async ({ pending, rank }: { pending: ReturnType<typeof prepare>, rank: any }) => {
  for (; pending.length;) {
    const music = pending.shift()
    const { uid, difficulty, name, platform, api } = music
    const result = (await download({ uid, difficulty, api }).catch((): APIResults => []))
      .filter(({ play, user }) => play && user)
    if (!result.length) {
      pending.unshift(music)
      console.log(`RETRY: ${uid}: ${name} - ${difficulty} - ${platform}`)
      continue
    }

    const currentUidRank: string[] = (await rank.get({ uid, difficulty, platform }) || []).map(({ play }) => play.user_id)

    const resultWithHistory = result.map(r => {
      if (currentUidRank.length) {
        return { ...r, history: { lastRank: currentUidRank.indexOf(r.play.user_id) } }
      } else {
        return r
      }
    })

    await rank.put({ uid, difficulty, platform, value: resultWithHistory })

    console.log(`${uid}: ${name} - ${difficulty} - ${platform} / ${pending.length}`)
  }
}

const round = ({ PARALLEL, musicList, rank }: { musicList: ReturnType<typeof prepare>, rank, PARALLEL: number }) => Promise.all(Array(PARALLEL).fill([...musicList]).map(pending => core({ pending, rank })))

const analyze = ({ musicList, rank, player }) => [...musicList]
  .reduce(async (p, m) => {
    await p
    const { uid, difficulty, platform } = m
    const currentRank = await rank.get({ uid, difficulty, platform })
    const sumRank = await rank.get({ uid, difficulty, platform: 'all' })
    return (await currentRank
      .map(async ({ user, play: { score, acc }, history }, i) => {
        let playerData = await player.get(user.user_id).catch(() => ({ plays: [] }))
        playerData.user = user
        const sum = sumRank.findIndex(play => play.platform === platform && play.user.user_id === user.user_id)
        playerData.plays.push({ score, acc, i, platform, history, difficulty, uid, sum })
        return { key: user.user_id, value: playerData }
      })
      .reduce(async (b, v) => {
        const { key, value } = await v
        const batch = await b
        return batch.put(key, value)
      }, player.batch()))
      .write()
  }, player.clear())

const sumRank = async ({ musicList, rank }: { rank, musicList: ReturnType<typeof prepare> }) => (await musicList
  .filter(({ platform }) => platform === 'mobile')
  .map(async ({ uid, difficulty }) => {
    let [currentRank, result] = [await rank.get({ uid, difficulty, platform: 'all' }), (await Promise.all(Object.keys(platforms).map(async platform => (await rank.get({ uid, difficulty, platform })).map(play => ({ ...play, platform })))))
      .flat()
      .sort((a, b) => b.play.score - a.play.score)]
    if (currentRank) {
      for (let i = 0; i < result.length; i++) {
        result[i].history = { lastRank: currentRank.findIndex(play => play.platform === result[i].platform && play.user.user_id === result[i].user.user_id) }
      }
    }
    return { uid, difficulty, platform: 'all', value: result }
  })
  .reduce(async (b, v) => (await b).put(await v), rank.batch()))
  .write()

const makeSearch = ({ player, search }) => new Promise(async resolve => {
  await search.clear()
  console.log('Search cleared')
  const batch = search.batch()
  const stream = player.createValueStream()
  stream.on('data', ({ user: { nickname, user_id } }) => {
    batch.put(user_id, nickname)
  })
  stream.on('close', () => resolve(batch.write()))
})

export default async ({ music, rank, player, PARALLEL, search }: { music: Musics, rank: {}, player, PARALLEL: number, search }) => {
  while (true) {
    const startTime = Date.now()
    const nextStart = wait(INTERVAL)
    const musicList = prepare(music)
    await round({ PARALLEL, musicList, rank })
    await sumRank({ musicList, rank })
    console.log('Ranked')
    await analyze({ musicList, rank, player })
    console.log('Analyzed')
    await makeSearch({ player, search })
    console.log('Search Cached')
    const endTime = Date.now()
    console.log(`Wait ${INTERVAL - (endTime - startTime)}`)
    await nextStart
  }
}
