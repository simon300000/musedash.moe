import sub from 'subleveldown'
import got from 'got'

import Router from '@koa/router'

import { parseStringPromise } from 'xml2js'

import { mdmc as db } from './database.js'
import { log as rawLog, error as rawError, app } from './api.js'

import { download, resultWithHistory, makeSearch, search as searchF } from './common.js'

import { APIResults, RankValue, User, Play as RawPlay } from './type.js'

const wait = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))

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

const downloadSongs = async (): Promise<Musics> => (await got('https://mdmc.moe/api/data/charts', { timeout: 1000 * 60 }).json() as any)

// eslint-disable-next-line camelcase
const downloadCore = ({ name, difficulty }: { name: string, difficulty: number }) => async (): Promise<APIResults | void> => (await got(`https://mdmc.moe/hq/api/md?song_name=${Buffer.from(name).toString('base64url')}&music_difficulty=${difficulty + 1}`, { timeout: 1000 * 10 }).json() as any).result.map(({ user: { steam_id, ...restUser }, ...rest }) => ({ ...rest, user: { ...restUser, user_id: steam_id } }))

const steamAvatarURL = (id: string) => got(`https://steamcommunity.com/profiles/${id}?xml=1`).text().then(parseStringPromise).then(({ profile: { avatarFull } }) => avatarFull[0] as string).catch(() => undefined)

const core = async ({ name, id, difficulty, l }: MusicCore & { l: { i: number } }) => {
  const f = downloadCore({ name, difficulty })
  const s = `${name} - ${difficulty}`
  const result = await download({ f, s, error })

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

const analyze = async (results: (RankCode & { value: RankValue[] })[]) => (await Object.entries(results
  .reduce((r, { id, difficulty, value }) => value
    // eslint-disable-next-line camelcase
    .reduce((rr, { user: { user_id, nickname }, history, play: { score, acc, character_uid, elfin_uid } }, i) => {
      if (!rr[user_id]) {
        rr[user_id] = { user: { user_id, nickname }, plays: [] }
      }
      rr[user_id].plays.push({ id, history, score, acc, difficulty, i, character_uid, elfin_uid })
      return rr
    }, r), {} as PlayerR))
  .reduce(async (p, [id, player]) => {
    const avatar = await steamAvatarURL(id)
    const b = await p
    player.user.avatar = avatar
    return b.put(id, player)
  }, player.clear().then(() => player.batch())))
  .write()

const mal = async () => {
  log('Start!')
  await refreshMusics()
  const list = makeList()
  const l = { i: list.length }

  const results = await list
    .map(w => ({ ...w, l }))
    .reduce(async (p, c) => {
      const l = await p
      return [...l, await core(c)]
    }, Promise.all([] as ReturnType<typeof core>[]))
  log('Downloaded')

  await analyze(results)
  log('Analyzed')

  await makeSearch({ log, player, search })
  log('Search Cached')
}

export const run = async () => {
  log('hi~')
  await mal()
  while (true) {
    const currentHour = new Date().getUTCHours()
    const waitTime = (19 - currentHour + 24) % 24 || 24
    log(`WAIT: ${waitTime}h`)
    await wait(waitTime * 60 * 60 * 1000)
    const startTime = Date.now()
    await mal()
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
  ctx.body = await player.get(ctx.params.id).catch(() => undefined)
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

interface Music {
  id: string,
  name: string,
  author: string,
  bpm: number,
  levelDesigner?: string,
  levelDesigner1?: string,
  levelDesigner2?: string,
  levelDesigner3?: string,
  levelDesigner4?: string,
  difficulty1: string,
  difficulty2: string,
  difficulty3: string,
  scene: string,
  unlockLevel: string
}

type Musics = Music[]

interface RankCode {
  difficulty: number,
  id: string
}

interface MusicCore extends RankCode {
  name: string
}

type Play = Omit<RawPlay, 'platform' | 'uid' | 'sum'> & { id: string }

export interface PlayerValue {
  plays: Play[],
  user: User
}

type PlayerR = Record<string, PlayerValue>
