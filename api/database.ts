import sub from 'subleveldown'
import level from 'level'

const db = level('./db')

const rankdb = sub(db, 'rank', { valueEncoding: 'json' })

export const player = sub(db, 'player', { valueEncoding: 'json' })
export const search = sub(db, 'search', { valueEncoding: 'json' })

export const rank = {
  put: ({ uid, difficulty, platform, value }: { uid: string, difficulty: number, platform: string, value }) => rankdb.put(`${uid}_${platform}_${difficulty}`, value),
  get: ({ uid, difficulty, platform }) => rankdb.get(`${uid}_${platform}_${difficulty}`).catch(() => undefined)
}
