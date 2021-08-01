import { LevelUp } from 'levelup'

import { APIResults, RankValue } from './type'

import { SearchType } from './database.js'

const wait = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))

export const download = async<T extends APIResults>({ f, i = 3, s, error }: { i?: number, f: (() => Promise<T | void>), s: string, error: ((w: string) => void) }): Promise<T> => {
  const result = await f().catch((e): T => {
    console.error(e)
    return undefined
  })
  if (!result) {
    if (i >= 0) {
      error(`RETRY: ${s}, ${i}`)
      await wait(1000 * 60 * Math.random())
      return download({ f, error, s, i: i - 1 })
    } else {
      error(`NO: ${s}`)
    }
  } else {
    return result.filter(({ play, user } = { play: undefined, user: undefined }) => play && user) as T
  }
}

export const resultWithHistory = ({ result, current }: { result: APIResults, current: RankValue[] }): RankValue[] => {
  const currentUidRank: string[] = current.map(({ play }) => play.user_id)

  return result.map(r => {
    if (currentUidRank.length) {
      return { ...r, history: { lastRank: currentUidRank.indexOf(r.play.user_id) } }
    } else {
      return r
    }
  })
}

export const makeSearch = <PlayerType extends LevelUp>({ search, player, log }: { log: (w: string) => void, search: SearchType, player: PlayerType }) => new Promise(async resolve => {
  await search.clear()
  log('Search cleared')
  const batch = search.batch()
  const stream = player.createValueStream()
  // eslint-disable-next-line camelcase
  stream.on('data', ({ user: { nickname, user_id } }) => batch.put(user_id, nickname.toLowerCase()))
  stream.on('close', () => resolve(batch.write()))
})

export const search = async <PlayerType extends LevelUp>({ search, q, player }: { search: SearchType, q: string, player: PlayerType }) => {
  const query = [...new Set(q
    .toLowerCase()
    .split(' ')
    .filter(Boolean))]
  if (query.length) {
    const profiles: Promise<any>[] = await new Promise(resolve => {
      const result = []
      const stream = search.createReadStream()
      // eslint-disable-next-line camelcase
      stream.on('data', ({ key: user_id, value: nickname }) => {
        if (!query.find(word => !nickname.includes(word))) {
          result.push(player.get(user_id)
            .then(({ user: { nickname: name, user_id: id } }) => [name, id])
            .catch(() => undefined))
        }
      })
      stream.on('close', () => resolve(result))
    })
    const result = await Promise.all(profiles)
    return result.filter(Boolean)
  }
  return []
}
