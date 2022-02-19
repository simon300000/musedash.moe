import sub from 'subleveldown'
import level from 'level'

import { RankKey, RankValue, PlayerValue } from './type.js'
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

  static mkDB(name: string) {
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
