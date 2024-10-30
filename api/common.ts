import { AbstractSublevel } from 'abstract-level'

import { PlayerValue } from './type.js'

type SearchType = AbstractSublevel<any, any, string, string>
type PlayerType = AbstractSublevel<any, any, string, PlayerValue>

export const wait = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))

export const resultWithHistory = <U extends { user: { user_id: string | number } }, T extends U,>({ result, current }: { result: T[], current: U[] }): U[] => {
  const currentUidRank: (string | number)[] = current.map(({ user }) => user.user_id)

  return result.map(r => {
    if (currentUidRank.length) {
      return { ...r, history: { lastRank: currentUidRank.indexOf(r.user.user_id) } }
    } else {
      return r
    }
  })
}

export const makeSearch = async ({ search, player, log }: { log: (w: string) => void, search: SearchType, player: PlayerType }) => {
  await search.clear()
  log('Search cleared')
  const batch = search.batch()
  for await (const { user: { nickname, user_id } } of player.values()) {
    batch.put(user_id, nickname)
  }
  await batch.write()
}

export const search = async ({ search, q }: { search: SearchType, q: string }) => {
  const query = [
    ...new Set(q
      .toLowerCase()
      .split(' ')
      .filter(Boolean))
  ]
  if (query.length) {
    const result = []
    for await (const [id, name] of search.iterator()) {
      const lower = name.toLowerCase()
      if (query.every(word => lower.includes(word))) {
        result.push([name, id])
      }
    }
    return result
  }
  return []
}
