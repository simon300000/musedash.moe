/* eslint camelcase: ["off"] */
import got from 'got'

import { MusicData, MusicCore, PlayerValue, RawAPI, RankKey } from './type.js'
import { rank, player, search, rankUpdateTime, playerUpdateTime } from './database.js'
import { musics } from './albumParser.js'

import { log, error, reloadAlbums } from './api.js'

import { resultWithHistory, wait } from './common.js'

import { diffdiff, diffPlayer } from './diffdiff.js'

import { SPIDER_PARALLEL } from './config.js'

const waits = new Map<string, Wait>()

let spiders = SPIDER_PARALLEL

let musicList: MusicData[] = []

const platforms = {
  mobile: 'leaderboard',
  pc: 'pcleaderboard'
} as const

const down = async (url: string) => got(url, { timeout: 1000 * 10 }).json<RawAPI>()

const downloadCore = async ({ uid, difficulty, platform }: RankKey) => {
  const api = platforms[platform]
  const { result: firstPage, total } = await down(`https://prpr-muse-dash.peropero.net/musedash/v1/${api}/top?music_uid=${uid}&music_difficulty=${difficulty + 1}&limit=100&offset=0&version=1.5.0&platform=musedash.moe`)
  const pageNumber = Math.max(Math.ceil(total / 100) - 1, 0)
  const urls = Array(pageNumber).fill(undefined).map((_, i) => i + 1).map(i => i * 100 - 1).map(limit => `https://prpr-muse-dash.peropero.net/musedash/v1/${api}/top?music_uid=${uid}&music_difficulty=${difficulty + 1}&limit=${limit}&offset=1&version=1.5.0&platform=musedash.moe`)
  return [firstPage, ...await Promise.all(urls.map(url => down(url).then(({ result }) => result)))]
    .flat()
    .filter(r => r?.play?.score != undefined && r?.user?.user_id != undefined)
}

const sum = async ({ uid, difficulty }: MusicCore) => {
  const [currentRank, result] = [await rank.get({ uid, difficulty, platform: 'all' }), (await Promise.all(Object.keys(platforms).map(async platform => (await rank.get({ uid, difficulty, platform }) || []).map(play => ({ ...play, platform })))))
    .flat()
    .sort((a, b) => b.play.score - a.play.score)]
  if (currentRank) {
    for (let i = 0; i < result.length; i++) {
      result[i].history = { lastRank: currentRank.findIndex(play => play.platform === result[i].platform && play.user.user_id === result[i].user.user_id) }
    }
  }
  await rank.put({ uid, difficulty, platform: 'all', value: result })
  await rankUpdateTime.update({ uid, difficulty, platform: 'all' })
  log(`SUM Update: ${waits.get(genKey({ uid, difficulty, platform: 'pc' })).music.name} - ${difficulty}`)
}

const spiderWorks = () => [...waits.values()].filter(({ ready, nextDownload }) => ready && nextDownload < Date.now()).length

const download = async ({ uid, difficulty, platform }: RankKey) => {
  const s = `${waits.get(genKey({ uid, difficulty, platform })).music.name} - ${difficulty} - ${platform}`
  const result = await downloadCore({ uid, difficulty, platform }).catch(() => {
    error(`Skip: ${s}`)
  })

  if (result) {
    const current = (await rank.get({ uid, difficulty, platform }) || [])
    await rank.put({ uid, difficulty, platform, value: resultWithHistory({ result, current }) })
    log(`Download: ${s} / ${spiderWorks()}`)
    await rankUpdateTime.update({ uid, difficulty, platform })
    await sum({ uid, difficulty })
    return true
  }
  return false
}


const analyzePlayers = (musicData: RankKey[], key: string) => musicData
  .reduce(async (rP, { uid, difficulty, platform }) => {
    const records = await rP

    const currentRank = await rank.get({ uid, difficulty, platform })
    const sumRank = await rank.get({ uid, difficulty, platform: 'all' })

    currentRank.forEach(({ user, play: { score, acc, character_uid, elfin_uid }, history }, i) => {
      const id = user.user_id
      if (id) {
        if (!records[id]) {
          records[id] = { plays: [], user, key }
        }
        const sumI = sumRank.findIndex(play => play.platform === platform && play.user.user_id === user.user_id)
        records[id].plays.push({ score, acc, i, platform, history, difficulty, uid, sum: sumI, character_uid, elfin_uid })
      }
    })
    return records
  }, Promise.resolve({} as Record<string, PlayerValue>))

const deleteOld = (k: string) => new Promise(resolve => {
  const deleteBatch = player.batch()
  player.createReadStream()
    .on('data', ({ key, value }) => {
      if (value.key !== k) {
        deleteBatch.del(key)
      }
    })
    .on('end', () => {
      resolve(deleteBatch.write())
    })
})

const analyze = async (musicData: RankKey[]) => {
  const key = String(Math.random())
  const players = Object.entries(await analyzePlayers(musicData, key))
  const batch = player.batch()
  players.forEach(([k, v]) => {
    batch.put(k, v)
    playerUpdateTime.batchUpdate(k)
  })

  const playerTimeP = playerUpdateTime.flush()

  await batch.write()
  log('Analyzed')

  await deleteOld(key)
  await playerTimeP
  log('Player Refreshed')

  return players
}

const makeSearch = (players: [string, PlayerValue][]) => {
  const batch = search.batch()
  players.forEach(([id, { user: { nickname } }]) => batch.put(id, nickname.toLowerCase()))
  return search.clear().then(() => batch.write())
}

const prepare = (music: MusicData) => {
  const { uid, difficulty: difficulties } = music
  const cores = difficulties
    .map((diffculty, diffcultyNum) => {
      if (diffculty !== '0') {
        return diffcultyNum
      }
    })
    .filter(diffculty => diffculty !== undefined)
    .flatMap<RankKey>(difficulty => Object.keys(platforms).map(platform => ({ uid, difficulty, platform })))
  return cores.map(core => ({ core, music }))
}

const genKey = ({ uid, difficulty, platform }: RankKey) => `${uid}-${difficulty}-${platform}`

const refreshMusicList = async () => {
  log('Refresh Music List')
  musicList = await musics()
  const cores = musicList.flatMap(prepare)
  cores.forEach(({ core, music }) => {
    const key = genKey(core)
    if (!waits.has(key)) {
      log(`Add ${key}`)
      waits.set(key, { key, core, music, nextDownload: 0, ready: true })
    }
  })
}

const waitSpiderSleep = async () => {
  while (spiderWorks()) {
    await wait(1000 * 60 * 3)
  }
}

const spider = async () => {
  while (spiderWorks()) {
    const next = [...waits.values()].find(({ ready, nextDownload }) => ready && nextDownload < Date.now())
    if (next) {
      next.ready = false
      const { core } = next
      const success = await download(core)
      if (success) {
        next.nextDownload = Date.now() + 1000 * 60 * 60 * 20
      } else {
        next.nextDownload = Date.now() + 1000 * 60 * 60 * 3
      }
      next.ready = true
    }
  }
}

const wakeupSpider = async () => {
  if (spiders) {
    spiders--
    wakeupSpider()
    console.log('spider wake')
    await spider()
    spiders++
    console.log('spider sleep')
  }
}

const spiderClock = async () => {
  while (true) {
    if (spiderWorks()) {
      wakeupSpider()
    }
    await wait(1000 * 60 * 5)
  }
}

const mal = async (musicData: MusicData[]) => {
  log('Start!')
  const players = await analyze([...waits.values()].map(({ core }) => core))
  await makeSearch(players)
  log('Search Cached')
  await diffdiff(musicData)
  log('Difficulty ranked')
  await diffPlayer(players)
  log('Players Analyzed')
  await reloadAlbums()
}


export const run = async () => {
  log('hi~')
  await refreshMusicList()
  spiderClock()
  while (true) {
    const currentHour = new Date().getUTCHours()
    const waitTime = (19 - currentHour + 24) % 24 || 24
    log(`WAIT: ${waitTime}h`)
    await wait(waitTime * 60 * 60 * 1000)
    await refreshMusicList()
    await waitSpiderSleep()
    const startTime = Date.now()
    await mal(musicList)
    const endTime = Date.now()
    log(`TAKE ${endTime - startTime}, at ${new Date().toString()}`)
  }
}

type Wait = {
  key: string
  nextDownload: number
  ready: boolean
  core: RankKey
  music: MusicData
}
