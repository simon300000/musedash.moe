import { RaveLevel } from 'rave-level'

import { RankKey, RankValue, PlayerValue, TagExport, APIResult, genKey, MusicCore } from './type.js'
import { MusicDiffDiff, DiffDiffResult } from './diffdiff.js'

const TWO_DAY = 1000 * 60 * 60 * 24 * 2

const db = new RaveLevel('./db')

export const tuneName = 'base'

const rankdb = db.sublevel<string, RankValue[]>('rank', { valueEncoding: 'json' })

export const player = db.sublevel<string, PlayerValue>('player', { valueEncoding: 'json' })
export const search = db.sublevel<string, string>('search', { valueEncoding: 'json' })

export type PlayerType = typeof player
export type SearchType = typeof search

class TimeDB<K> {
  db: ReturnType<typeof TimeDB.mkDB>
  f: (k: K) => string
  batch: ReturnType<typeof this.db.batch>

  constructor(name: string, f: (k: K) => string) {
    this.db = TimeDB.mkDB(name)
    this.f = f
  }
  async update(k: K) {
    await this.db.put(this.f(k), Date.now())
  }
  get(k: K) {
    return this.db.get(this.f(k)).catch(() => 0)
  }
  batchUpdate(k: K) {
    if (!this.batch) {
      this.batch = this.db.batch()
    }
    this.batch.put(this.f(k), Date.now())
  }
  async flush() {
    if (this.batch) {
      const batch = this.batch
      this.batch = undefined
      await batch.write()
    }
  }

  private static mkDB(name: string) {
    return db.sublevel<string, number>(`time-${name}`, { valueEncoding: 'json' })
  }
}

export const rank = {
  put: ({ uid, difficulty, platform, value }: RankKey & { value: RankValue[] }) => rankdb.put(`${uid}_${platform}_${difficulty}`, value),
  get: ({ uid, difficulty, platform }: RankKey) => rankdb.get(`${uid}_${platform}_${difficulty}`).catch(() => [] as RankValue[])
}

export const rankUpdateTime = new TimeDB<RankKey>('rank', ({ uid, difficulty, platform }) => `${uid}_${platform}_${difficulty}`)
export const playerUpdateTime = new TimeDB<string>('player', id => id)

export const mdmc = db.sublevel('mdmc', { valueEncoding: 'json' })

const diffDiffDB = db.sublevel<string, MusicDiffDiff[]>(`diffDiff${tuneName}`, { valueEncoding: 'json' })

export const putDiffDiff = (diffDiff: MusicDiffDiff[]) => diffDiffDB.put('diff', diffDiff)
export const getDiffDiff = () => diffDiffDB.get('diff').catch(() => [] as MusicDiffDiff[])

const diffDiffDBMusic = db.sublevel<string, DiffDiffResult>(`diffDiffMusic${tuneName}`, { valueEncoding: 'json' })
export const putDIffDiffMusic = async ({ uid, difficulty }: MusicCore, value: DiffDiffResult) => {
  const key = `${uid}_${difficulty}`
  await diffDiffDBMusic.put(key, value)
}
export const getDIffDiffMusic = async ({ uid, difficulty }: MusicCore) => diffDiffDBMusic.get(`${uid}_${difficulty}`)

export const playerDiff = db.sublevel<string, number>(`playerDiff${tuneName}`, { valueEncoding: 'json' })

const state = db.sublevel<string, any>('state', { valueEncoding: 'json' })

export const putTag = (tag: TagExport) => state.put('tag', tag)
export const getTag = () => state.get('tag').catch(() => [] as TagExport)

const updateNewest = async (time: number) => {
  const current = await state.get('newest').catch(() => 0)
  if (time > current) {
    await state.put('newest', time)
  }
}

const isNew = async (time: number) => {
  const current = await state.get('newest').catch(() => 0)
  return time >= (current - 1000 * 60 * 60 * 24)
}

export const setPlayerNumer = (num: number) => state.put('playerNum', num)
export const getPlayerNumer = () => state.get('playerNum').catch(() => 0)

type PlayerDiff = {
  id: string
  rl: number
}

export const setPlayerDiffRank = (diff: PlayerDiff[]) => state.put('playerDiffRank', diff)
export const getPlayerDiffRank = () => state.get('playerDiffRank').catch(() => [] as PlayerDiff[])

const newSong = db.sublevel<string, number>('newSong', { valueEncoding: 'json' })

export const checkNewSong = async (id: string) => {
  const current = await newSong.get(id).catch(() => 0)
  if (current === 0) {
    const now = Date.now()
    await newSong.put(id, now)
    await updateNewest(now)
  }
}

export const isNewSong = async (id: string) => {
  const current = await newSong.get(id).catch(() => 0)
  return isNew(current)
}

export const isWeekOldSong = async (id: string) => {
  const now = Date.now()
  const current = await newSong.get(id).catch(() => Date.now())
  return now - current > 1000 * 60 * 60 * 24 * 7
}

export const playerDataOld = async () => {
  const now = Date.now()
  const lastUpdate = await state.get('playerLastUpdate').catch(() => 0) as number
  return now - lastUpdate > 1000 * 60 * 60 * 24
}

export const updatePlayerData = () => state.put('playerLastUpdate', Date.now())

type NOW = {
  now: number
}

const raw = db.sublevel<string, APIResult & NOW>('raw', { valueEncoding: 'json' })

export const saveRaw = async (rankKey: RankKey, id: string, value: APIResult) => {
  const key = `${genKey(rankKey)}_${id}`
  const now = Date.now()
  await raw.put(key, { ...value, now })
}

export const getRaw = (rankKey: RankKey, id: string) => {
  const key = `${genKey(rankKey)}_${id}`
  return raw.get(key).catch<undefined>(() => undefined)
}

export const cleanOldRaw = async () => {
  const chain = raw.batch()
  for await (const [w, { now }] of raw.iterator()) {
    if (now < Date.now() - TWO_DAY) {
      chain.del(w)
    }
  }
  await chain.write()
}

const MAX_TIME_DELTA = 1000 * 60 * 60 * 24 * 15
const MIN_DIFF_DELTA = 0.005

type PlayerDiffEntry = {
  time: number
  diff: number
  rank: number
}

const playerDiffHistory = db.sublevel<string, any>('playerDiffHistory', { valueEncoding: 'json' })
const playerDiffHistoryNumber = playerDiffHistory.sublevel<string, number>('number', { valueEncoding: 'json' })
const playerDiffHistoryDB = playerDiffHistory.sublevel<string, PlayerDiffEntry>('db', { valueEncoding: 'json' })

export const getPlayerDiffHistoryNumber = (id: string) => playerDiffHistoryNumber.get(id).catch(() => 0)
const setPlayerDiffHistoryNumber = (id: string, value: number) => playerDiffHistoryNumber.put(id, value)

export const insertPlayerDiffHistory = async (id: string, diff: number, rank: number) => {
  const time = Date.now()
  const number = await getPlayerDiffHistoryNumber(id)
  const key = `${id}_${number}`
  const entry = { time, diff, rank }
  if (number === 0) {
    await playerDiffHistoryDB.put(key, entry)
    await setPlayerDiffHistoryNumber(id, 1)
    return
  }

  const { time: lastTime, diff: lastDiff, rank: lastRank } = await playerDiffHistoryDB.get(`${id}_${number - 1}`)
  const minRankDelta = Math.min(rank, lastRank) * 0.05
  if (time - lastTime > MAX_TIME_DELTA || Math.abs(rank - lastRank) > minRankDelta || Math.abs(diff - lastDiff) > MIN_DIFF_DELTA) {
    await playerDiffHistoryDB.put(key, entry)
    await setPlayerDiffHistoryNumber(id, number + 1)
  }
}

export const getPlayerDiffHistory = async (id: string, start: number, length: number) => {
  const max = await getPlayerDiffHistoryNumber(id)
  return Promise.all(
    Array(Math.min(max, length))
      .fill(start)
      .map((v, i) => v + i)
      .map(w => `${id}_${w}`)
      .map(w => playerDiffHistoryDB.get(w).catch(() => undefined))
  )
}
