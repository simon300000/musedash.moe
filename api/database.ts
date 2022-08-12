import sub from 'subleveldown'
import level from 'level'

import { RankKey, RankValue, PlayerValue, TagExport } from './type.js'
import { MusicDiffDiff } from './diffdiff.js'

const db = level('./db', { cacheSize: 128 * 1024 * 1024 })

const rankdb = sub<string, RankValue[]>(db, 'rank', { valueEncoding: 'json' })

export const player = sub<string, PlayerValue>(db, 'player', { valueEncoding: 'json' })
export const search = sub<string, string>(db, 'search', { valueEncoding: 'json' })

export type PlayerType = typeof player
export type SearchType = typeof search

class TimeDB<K> {
  db: ReturnType<typeof TimeDB.mkDB>
  f: (k: K) => string
  batch: ReturnType<typeof db.batch>

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
    return sub<string, number>(db, `time-${name}`, { valueEncoding: 'json' })
  }
}

export const rank = {
  put: ({ uid, difficulty, platform, value }: RankKey & { value: RankValue[] }) => rankdb.put(`${uid}_${platform}_${difficulty}`, value),
  get: ({ uid, difficulty, platform }: RankKey) => rankdb.get(`${uid}_${platform}_${difficulty}`).catch(() => undefined as RankValue[])
}

export const rankUpdateTime = new TimeDB<RankKey>('rank', ({ uid, difficulty, platform }) => `${uid}_${platform}_${difficulty}`)
export const playerUpdateTime = new TimeDB<string>('player', id => id)

export const mdmc = sub(db, 'mdmc', { valueEncoding: 'json' })

const diffDiffDB = sub<string, MusicDiffDiff[]>(db, 'diffDiff', { valueEncoding: 'json' })

export const putDiffDiff = (diffDiff: MusicDiffDiff[]) => diffDiffDB.put('diff', diffDiff)
export const getDiffDiff = () => diffDiffDB.get('diff').catch(() => [] as MusicDiffDiff[])

export const playerDiff = sub<string, number>(db, 'playerDiff', { valueEncoding: 'json' })

const state = sub<string, any>(db, 'state', { valueEncoding: 'json' })

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

const newSong = sub<string, number>(db, 'newSong', { valueEncoding: 'json' })

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

