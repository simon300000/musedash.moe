import sub from 'subleveldown'
import level from 'level'

import { RankKey, RankValue, PlayerValue } from './type.js'
import { MusicDiffDiff } from './diffdiff.js'

const db = level('./db')

const rankdb = sub<string, RankValue[]>(db, 'rank', { valueEncoding: 'json' })

export const player = sub<string, PlayerValue>(db, 'player', { valueEncoding: 'json' })
export const search = sub<string, string>(db, 'search', { valueEncoding: 'json' })

export type PlayerType = typeof player
export type SearchType = typeof search

export const rank = {
  put: ({ uid, difficulty, platform, value }: RankKey & { value: RankValue[] }) => rankdb.put(`${uid}_${platform}_${difficulty}`, value),
  get: ({ uid, difficulty, platform }: RankKey) => rankdb.get(`${uid}_${platform}_${difficulty}`).catch(() => undefined as RankValue[])
}

export const mdmc = sub(db, 'mdmc', { valueEncoding: 'json' })

const diffDiffDB = sub<string, MusicDiffDiff[]>(db, 'diffDiff', { valueEncoding: 'json' })

export const putDiffDiff = (diffDiff: MusicDiffDiff[]) => diffDiffDB.put('diff', diffDiff)
export const getDiffDiff = () => diffDiffDB.get('diff').catch(() => [] as MusicDiffDiff[])

export const playerDiff = sub<string, number>(db, 'playerDiff', { valueEncoding: 'json' })
