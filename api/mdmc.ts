import sub from 'subleveldown'

import Router from '@koa/router'

import { mdmc as db } from './database.js'
import { log as rawLog, error as rawError, app } from './api.js'

import { resultWithHistory, makeSearch, search as searchF, wait } from './common.js'

const log = (msg: string) => rawLog(`mdmc: ${msg}`)
const error = (msg: string) => rawError(`mdmc: ${msg}`)

const rankdb = sub<string, RankValue[]>(db, 'rank', { valueEncoding: 'json' })

const rank = {
  put: ({ id, difficulty, value }: RankCode & { value: RankValue[] }) => rankdb.put(`${id}_${difficulty}`, value),
  get: ({ id, difficulty }: RankCode) => rankdb.get(`${id}_${difficulty}`).catch(() => [] as RankValue[])
}

export const player = sub<string, PlayerValue>(db, 'player', { valueEncoding: 'json' })
const search = sub<string, string>(db, 'search', { valueEncoding: 'json' })

let musics: Musics = []

const refreshMusics = async () => {
  musics = await downloadSongs()
  log('Reload Musics')
}

const makeList = () => musics.flatMap(({ name, difficulty1, difficulty2, difficulty3, id }) => [{ name, difficulty: 0, id, level: difficulty1 }, { name, difficulty: 1, id, level: difficulty2 }, { name, difficulty: 2, id, level: difficulty3 }]).filter(({ level }) => level !== '0')

const downloadSongs = () => fetch('https://mdmc.moe/api/v4/charts').then<Musics>(w => w.json())

const downloadCore = async ({ name, difficulty }: { name: string, difficulty: number }) => {
  const w = await fetch(`https://mdmc.moe/api/v4/hq/md?song_name=${encodeURI(name)}&music_difficulty=${difficulty + 1}`).then<APIResults>(p => p.json())
  return w.result.map(({ user: { discord_id, ...restUser }, ...rest }) => ({ ...rest, user: { ...restUser, user_id: discord_id } }))
}

const core = async ({ name, id, difficulty, l }: MusicCore & { l: { i: number } }) => {
  const s = `${name} - ${difficulty}`
  const result = await downloadCore({ name, difficulty }).catch<undefined>(() => {
    error(`Skip: ${s} - Failed`)
    return undefined
  })

  const current = await rank.get({ id, difficulty })
  if (result) {
    const value = resultWithHistory({ result, current })

    await rank.put({ id, difficulty, value })
    l.i--
    log(`${s} / ${l.i}`)
    return { id, difficulty, value }
  }
  return { id, difficulty, value: current }
}

const analyze = async (results: (RankCode & { value: RankValue[] })[]) => {
  const batch = await Object.entries(results
    .reduce((r, { id, difficulty, value }) => value
      .reduce((rr, { user: { user_id, nickname }, history, play: { score, acc, character_uid, elfin_uid } }, i) => {
        if (!rr[user_id]) {
          rr[user_id] = { user: { user_id, nickname }, plays: [] }
        }
        rr[user_id].plays.push({ id, history, score, acc, difficulty, i, character_uid, elfin_uid })
        return rr
      }, r), {} as PlayerR))
    .reduce(async (p, [id, player]) => {
      const b = await p
      return b.put(id, player)
    }, Promise.resolve(player.batch()))
  await player.clear()
  await batch.write()
}

const mal = async () => {
  log('Start!')
  await refreshMusics()
  const list = makeList()
  const l = { i: list.length }

  const results = await Promise.all(list.map(w => ({ ...w, l })).map(core))
  log('Downloaded')

  await analyze(results)
  log('Analyzed')

  await makeSearch({ log, player, search })
  log('Search Cached')
}

export const run = async () => {
  log('hi~')
  await mal().catch(() => error('error, skip'))
  while (true) {
    const currentHour = new Date().getUTCHours()
    const waitTime = (19 - currentHour + 24) % 24 || 24
    log(`WAIT: ${waitTime}h`)
    await wait(waitTime * 60 * 60 * 1000)
    const startTime = Date.now()
    await mal().catch(() => error('error, skip'))
    const endTime = Date.now()
    log(`TAKE ${endTime - startTime}, at ${new Date().toString()}`)
  }
}

const router = new Router({
  prefix: '/mdmc'
})

router.get('/musics', async (ctx: any) => {
  ctx.body = musics
})

router.get('/player/:id', async ctx => {
  ctx.body = await player.get(ctx.params.id).catch(() => ({ plays: [], key: '', user: { user_id: '404', nickname: 'User not Found' } }))
})

router.get('/rank/:id/:difficulty', async ctx => {
  let result = await rank.get(ctx.params as any)
  if (result) {
    // eslint-disable-next-line camelcase
    ctx.body = result.map(({ play: { acc, score, character_uid, elfin_uid }, history: { lastRank } = { lastRank: -1 }, user: { nickname, user_id } }) => [acc, score, lastRank, nickname, user_id, character_uid, elfin_uid])
  }
})

router.get('/search/:string', async ctx => {
  ctx.body = await searchF({ search, q: ctx.params.string, player })
})

app.use(router.routes())



type Music = {
  name: string
  author: string
  bpm: number
  scene: string
  levelDesigner: string
  levelDesigner1: string
  levelDesigner2: string
  levelDesigner3: string
  levelDesigner4: string
  difficulty1: string
  difficulty2: string
  difficulty3: string
  unlockLevel: string
  id: string
}

type Musics = Music[]

type Play = {
  acc: number
  bms_id: string
  character_uid: string
  combo: number
  elfin_uid: string
  hp: number
  score: number
  user_id: string | unknown
  music_uid: string | unknown
  music_difficulty: number | unknown
  miss: number
  judge: string
  visible: boolean
}

type UserRaw = {
  nickname: string
  user_id: string | unknown
  discord_id: string
}

type User = {
  nickname: string
  user_id: string
}

type APIResult = {
  play: Play
  user: UserRaw
}

type APIResults = {
  code: number
  rank: {
    detail: unknown
    order: unknown
  }
  result: APIResult[]
  total: unknown
}

type RankCode = {
  difficulty: number,
  id: string
}

type MusicCore = RankCode & {
  name: string
}

type PlayerValue = {
  plays: (Pick<Play, 'acc' | 'score' | 'character_uid' | 'elfin_uid'> & RankCode & { history: { lastRank: number }, i: number })[]
  user: User
}

type PlayerR = Record<string, PlayerValue>

type RankValue = Omit<APIResult, 'user'> & {
  history?: {
    lastRank: number
  }
  user: User
}
