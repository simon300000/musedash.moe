import sub from 'subleveldown'
import level from 'level'

import { RankKey, RankValue, PlayerValue } from './type.js'

const db = level('./db')

const rankdb = sub<string, RankValue[]>(db, 'rank', { valueEncoding: 'json' })

export const player = sub<string, PlayerValue>(db, 'player', { valueEncoding: 'json' })
export const search = sub(db, 'search', { valueEncoding: 'json' })

export const rank = {
  put: ({ uid, difficulty, platform, value }: RankKey & { value: RankValue[] }) => rankdb.put(`${uid}_${platform}_${difficulty}`, value),
  get: ({ uid, difficulty, platform }: RankKey) => rankdb.get(`${uid}_${platform}_${difficulty}`).catch(() => undefined as RankValue[])
}
