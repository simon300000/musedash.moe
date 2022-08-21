import { Level } from 'level'

import { RankKey, RankValue, PlayerValue, TagExport, APIResult, genKey } from './type.js'
import { MusicDiffDiff } from './diffdiff.js'

const TWO_DAY = 1000 * 60 * 60 * 24 * 2

const db = new Level('./db')

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
  get: ({ uid, difficulty, platform }: RankKey) => rankdb.get(`${uid}_${platform}_${difficulty}`).catch(() => undefined as RankValue[])
}

export const rankUpdateTime = new TimeDB<RankKey>('rank', ({ uid, difficulty, platform }) => `${uid}_${platform}_${difficulty}`)
export const playerUpdateTime = new TimeDB<string>('player', id => id)

export const mdmc = db.sublevel('mdmc', { valueEncoding: 'json' })

const diffDiffDB = db.sublevel<string, MusicDiffDiff[]>('diffDiff', { valueEncoding: 'json' })

export const putDiffDiff = (diffDiff: MusicDiffDiff[]) => diffDiffDB.put('diff', diffDiff)
export const getDiffDiff = () => diffDiffDB.get('diff').catch(() => [] as MusicDiffDiff[])

export const playerDiff = db.sublevel<string, number>('playerDiff', { valueEncoding: 'json' })

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

