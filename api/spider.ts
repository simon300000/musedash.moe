import LRU from 'lru-cache'

import { MusicData, MusicCore, PlayerValue, RawAPI, RankKey, MusicTagList, genKey } from './type.js'
import { rank, player, search, rankUpdateTime, playerUpdateTime, putTag, checkNewSong, isNewSong, saveRaw } from './database.js'
import { albums, AvailableLocales, musics } from './albumParser.js'

import { log, error, reloadAlbums } from './api.js'

import { resultWithHistory, wait } from './common.js'

import { diffdiff, diffPlayer } from './diffdiff.js'

import { SPIDER_PARALLEL } from './config.js'

const waits = new Map<string, Wait>()

const downCache = new LRU<string, any>({
  maxAge: 1000 * 60 * 60
})

let spiders = SPIDER_PARALLEL

let musicList: MusicData[] = []

const platforms = {
  mobile: 'leaderboard',
  pc: 'pcleaderboard'
} as const

const sumMutexMap = new Map<string, Promise<void>>()

const sumWait = async ({ uid, difficulty }: MusicCore) => Promise.all(Object.keys(platforms).map(platform => genKey({ uid, difficulty, platform })).map(k => sumMutexMap.get(k)))

const sumLock = ({ uid, difficulty, platform }: RankKey) => {
  const key = genKey({ uid, difficulty, platform })
  let res
  sumMutexMap.set(key, new Promise(resolve => {
    res = resolve
  }))
  return res
}

const down = async <T>(url: string) => {
  const hit = downCache.get(url)
  if (hit) {
    return hit
  }
  const result = await fetch(url).then<T>(w => w.json())
  downCache.set(url, result)
  return result
}

const downloadTag = () => down<MusicTagList>('https://prpr-muse-dash.peropero.net/musedash/v1/music_tag?platform=pc')

const downloadCore = async ({ uid, difficulty, platform }: RankKey) => {
  const api = platforms[platform]
  const { result: firstPage, total } = await down<RawAPI>(`https://prpr-muse-dash.peropero.net/musedash/v1/${api}/top?music_uid=${uid}&music_difficulty=${difficulty + 1}&limit=100&offset=0&version=2.11.0&platform=musedash.moe`) //platform=ios_overseas
  const pageNumber = Math.max(Math.ceil(total / 100) - 1, 0)
  const urls = Array(pageNumber).fill(undefined).map((_, i) => i + 1).map(i => i * 100 - 1).map(limit => `https://prpr-muse-dash.peropero.net/musedash/v1/${api}/top?music_uid=${uid}&music_difficulty=${difficulty + 1}&limit=${limit}&offset=1&version=2.11.0&platform=musedash.moe`)
  return [firstPage, ...await Promise.all(urls.map(url => down<RawAPI>(url).then(({ result }) => result)))]
    .flat()
    .filter(r => r?.play?.score != undefined && r?.user?.user_id != undefined)
    .filter(r => r.play.acc <= 100)
}

const toSum = ({ uid, difficulty }: RankKey) => !Object.keys(platforms)
  .map(otherPlatform => genKey({ uid, difficulty, platform: otherPlatform }))
  .map(k => waits.get(k))
  .filter(Boolean)
  .some(({ ready, nextDownload }) => ready && nextDownload < Date.now())

const sum = async ({ uid, difficulty }: MusicCore) => {
  await sumWait({ uid, difficulty })
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

const download = async ({ uid, difficulty, platform }: RankKey, sumAfter = true) => {
  const s = `${waits.get(genKey({ uid, difficulty, platform })).music.name} - ${difficulty} - ${platform}`
  const relese = sumLock({ uid, difficulty, platform })
  const result = await downloadCore({ uid, difficulty, platform }).catch(() => {
    error(`Skip: ${s}`)
  })

  if (result) {
    const current = (await rank.get({ uid, difficulty, platform }) || [])
    await rank.put({ uid, difficulty, platform, value: resultWithHistory({ result, current }) })
    log(`Download: ${s} / ${spiderWorks()}`)
    await rankUpdateTime.update({ uid, difficulty, platform })
    relese()
    if (sumAfter) {
      await sum({ uid, difficulty })
    }
    await Promise.all(result.map(({ play, user: { user_id, ...user } }) => saveRaw({ uid, difficulty, platform }, user_id, { play, user: { ...user, user_id } })))
    return true
  }
  relese()
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

const deleteOld = async (k: string) => {
  const deleteBatch = player.batch()
  for await (const [id, { key }] of player.iterator()) {
    if (key !== k) {
      deleteBatch.del(id)
    }
  }
  await deleteBatch.write()
}

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

const refreshMusicList = async () => {
  log('Refresh Music List')
  musicList = await musics()
  const cores = musicList.flatMap(prepare)
  await Promise.all(cores.map(async ({ core, music }) => {
    const key = genKey(core)
    if (!waits.has(key)) {
      log(`Add ${key}`)
      const nextDownload = await rankUpdateTime.get(core) + 1000 * 60 * 60 * 24
      waits.set(key, { key, core, music, nextDownload, ready: true })
    }
  }))

  const albumList = await albums()

  type Wellknown = Record<string, {
    displayName: Record<AvailableLocales, string>
    musicList: {
      json: string
      musics?: string[]
    }[]
  }>

  const tags: Wellknown = {
    New: {
      displayName: {
        ChineseS: 'New',
        ChineseT: 'New',
        English: 'New',
        Japanese: 'New',
        Korean: 'New'
      },
      musicList: []
    },
    Default: {
      displayName: {
        ChineseS: '基础包',
        ChineseT: '基礎包',
        English: 'Default Music',
        Japanese: 'デフォルト曲',
        Korean: '기본 패키지'
      },
      musicList: []
    },
    Theme: {
      displayName: {
        ChineseS: '主题包',
        ChineseT: '主題包',
        English: 'Concept Pack',
        Japanese: 'テーマパック',
        Korean: '콘셉트 팩'
      },
      musicList: []
    },
    Happy: {
      displayName: {
        ChineseS: '肥宅快乐包',
        ChineseT: '肥宅快樂包',
        English: 'Happy Otaku Pack',
        Japanese: 'MUSIC快楽天',
        Korean: '오타쿠의 쾌락 모음'
      },
      musicList: []
    },
    Cute: {
      displayName: {
        ChineseS: '可爱即正义',
        ChineseT: '可愛即正義',
        English: 'Cute Is Everyting',
        Japanese: 'かわいいは正義',
        Korean: '귀여움은 정의다'
      },
      musicList: []
    },
    GiveUp: {
      displayName: {
        ChineseS: '放弃治疗',
        ChineseT: '放棄治療',
        English: 'Give Up TREATMENT',
        Japanese: '音ゲー依存症',
        Korean: '치유는 포기했어'
      },
      musicList: []
    },
    X: {
      displayName: {
        ChineseS: "联动",
        ChineseT: "聯動",
        English: "Collab",
        Japanese: "コラボ",
        Korean: "콜라보"
      },
      musicList: []
    },
    PlannedPlus: {
      displayName: {
        ChineseS: '计划通补完计划',
        ChineseT: '計劃通補完計劃',
        English: '[ Just as Planned ] Plus',
        Japanese: '計画通り補完計画',
        Korean: '"계획대로" 보완 계획'
      },
      musicList: []
    }
  }

  albumList.forEach(({ tag, json }) => {
    if (tags[tag]) {
      tags[tag].musicList.push({ json })
    }
  })

  for (const { uid } of musicList) {
    await checkNewSong(uid)
  }


  const newList: Record<string, string[]> = {}
  for (const { uid } of musicList) {
    if (await isNewSong(uid)) {
      const [albumNum] = uid.split('-')
      const json = `ALBUM${Number(albumNum) + 1}`
      if (!newList[json]) {
        newList[json] = []
      }
      newList[json].push(uid)
    }
  }

  tags.New.musicList = Object.entries(newList).map(([json, ids]) => ({ json, musics: ids }))

  const { music_tag_list: rawTag } = await downloadTag().catch(e => {
    log(e)
    return { music_tag_list: [] }
  })
  if (!rawTag.length) {
    return
  }
  const collab = rawTag.filter(({ tag_name: { English } }) => English === 'Collab').flatMap(({ music_list }) => music_list)
  const collabMusicList: Record<string, string[]> = {}
  collab.forEach(id => {
    const [albumNum] = id.split('-')
    const json = `ALBUM${Number(albumNum) + 1}`
    if (!collabMusicList[json]) {
      collabMusicList[json] = []
    }
    collabMusicList[json].push(id)
  })

  tags.X.musicList = Object.entries(collabMusicList).map(([json, ids]) => ({ json, musics: ids }))

  const tagExport = Object.entries(tags).map(([n, v]) => ({ name: n, ...v }))
  await putTag(tagExport)
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
      const sumAfter = toSum(core)
      const success = await download(core, sumAfter)
      if (success) {
        next.nextDownload = Date.now() + 1000 * 60 * 60 * 20
      } else {
        next.nextDownload = Date.now() + 1000 * 60 * 60 * 3
      }
      next.ready = true
      if (next.pending) {
        next.pending()
        next.pending = undefined
      }
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

export const joinJob = ({ uid, difficulty, platform }: RankKey): Promise<any> => {
  if (platform === 'all') {
    return Promise.all([joinJob({ uid, difficulty, platform: 'mobile' }), joinJob({ uid, difficulty, platform: 'pc' })])
  }

  const key = genKey({ uid, difficulty, platform })

  if (waits.has(key)) {
    const w = waits.get(key)
    const { nextDownload, pending } = w
    if (!pending && nextDownload - 1000 * 60 * 60 * 2 > Date.now()) {
      log(`Join: ${w.music.name} - ${w.core.difficulty} - ${w.core.platform}`)
      w.nextDownload = 0
      wait(0).then(() => wakeupSpider())
      return new Promise(resolve => {
        w.pending = resolve
      })
    }
  }

  return Promise.resolve()
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
  pending?: (value?: any) => void
}
