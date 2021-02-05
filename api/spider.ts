/* eslint camelcase: ["off"] */
import { Musics, APIResults } from './type'
import { rank } from './database'
import { PARALLEL } from './config'

import got from 'got'

const wait = (ms: number): Promise<undefined> => new Promise(resolve => setTimeout(resolve, ms))

const platforms = {
  mobile: 'leaderboard',
  pc: 'pcleaderboard'
}

const downloadCore = async ({ api, uid, difficulty }): Promise<APIResults | void> => (await got(`https://prpr-muse-dash.leanapp.cn/musedash/v1/${api}/top?music_uid=${uid}&music_difficulty=${difficulty + 1}&limit=1999`, { timeout: 1000 * 60 * 10 }).json() as any).result

const download = async ({ api, uid, difficulty }): Promise<APIResults> => {
  const result = await downloadCore({ api, uid, difficulty })
  if (!result) {
    console.log(`RETRY: ${uid} - ${difficulty} - ${api}`)
    await wait(1000 * 60 * Math.random())
    return download({ api, uid, difficulty })
  } else {
    return result
  }
}

const prepare = (music: Musics) => music
  .flatMap(({ uid, difficulty, name }) => difficulty
    .map((difficultyNum, difficulty) => ({ uid, level: difficultyNum, difficulty, name })))
  .flatMap(({ uid, difficulty, name, level }) => Object.entries(platforms)
    .map(([platform, api]) => ({ uid, difficulty, name, level, platform, api })))
  .filter(({ level }) => level !== '0')

const core = async ({ pending, rank }: { pending: ReturnType<typeof prepare>, rank: any }) => {
  for (; pending.length;) {
    const music = pending.shift()
    const { uid, difficulty, name, platform, api } = music
    const result = (await download({ uid, difficulty, api }).catch((): APIResults => []))
      .filter(({ play, user }) => play && user)
    if (!result.length) {
      pending.unshift(music)
      console.log(`EMPTY, RETRY: ${uid}: ${name} - ${difficulty} - ${platform}`)
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

const round = ({ musicList, rank }: { musicList: ReturnType<typeof prepare>, rank }) => Promise.all(Array(PARALLEL).fill([...musicList]).map(pending => core({ pending, rank })))

const analyze = ({ musicList, player }: { player, musicList: ReturnType<typeof prepare> }) => [...musicList]
  .reduce(async (p, { uid, difficulty, platform }) => {
    await p
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

const sumRank = ({ musicList }: { musicList: ReturnType<typeof prepare> }) => musicList
  .filter(({ platform }) => platform === 'mobile')
  .map(({ uid, difficulty }) => async () => {
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
  .reduce(async (p, v) => {
    await p
    await rank.put(await v())
  }, Promise.resolve())

const makeSearch = ({ player, search }) => new Promise(async resolve => {
  await search.clear()
  console.log('Search cleared')
  const batch = search.batch()
  const stream = player.createValueStream()
  stream.on('data', ({ user: { nickname, user_id } }) => batch.put(user_id, nickname.toLowerCase()))
  stream.on('close', () => resolve(batch.write()))
})

const mal = async ({ music, player, search }) => {
  console.log('Start!')
  const musicList = prepare(music)
  await round({ musicList, rank })
  console.log('Downloaded')
  await sumRank({ musicList })
  console.log('Ranked')
  await analyze({ musicList, player })
  console.log('Analyzed')
  await makeSearch({ player, search })
  console.log('Search Cached')
}

export default async ({ music, player, search }: { music: Musics, player: number, search }) => {
  console.log('hi~')
  await mal({ music, player, search })
  while (true) {
    const currentHour = new Date().getUTCHours()
    const waitTime = (19 - currentHour + 24) % 24 || 24
    console.log(`WAIT: ${waitTime}h`)
    await wait(waitTime * 60 * 60 * 1000)
    const startTime = Date.now()
    await mal({ music, player, search })
    const endTime = Date.now()
    console.log(`TAKE ${endTime - startTime}, at ${new Date().toString()}`)
  }
}
