import type {
  AlbumData,
  TagData,
  CEData,
  RankEntry,
  PlayerData,
  DiffDiffEntry,
  DiffDiffMusicEntry,
  DiffHistoryEntry,
  DispatchResponse,
  MdmcMusic,
  MdmcRankEntry,
  MdmcPlayerData,
  ApiTimingLog
} from './types'

// const url = 'https://api.musedash.moe/'
// const url = 'http://0.0.0.0:8301/'
const url = typeof window === 'undefined' ? 'http://0.0.0.0:8301/' : 'https://api.musedash.moe/'

const RESPONSE_TIME_HEADER = 'X-Response-Time'
const CACHE_STATUS_HEADER = 'X-Cache-Status'

type ResponseTimingRecorder = (data: ApiTimingLog) => void

let responseTimingRecorder: ResponseTimingRecorder | undefined

export const injectResponseTimingRecorder = (recorder: ResponseTimingRecorder): void => {
  responseTimingRecorder = recorder
}

const recordResponseTiming = (response: Response, method: string, api: string): void => {
  if (!responseTimingRecorder || typeof window === 'undefined' || method === 'OPTIONS') {
    return
  }
  const rawDuration = response.headers.get(RESPONSE_TIME_HEADER)
  const duration = Number.parseInt(rawDuration!, 10)
  if (Number.isNaN(duration)) {
    return
  }
  responseTimingRecorder({
    method,
    path: `/${api}`,
    duration,
    cacheStatus: response.headers.get(CACHE_STATUS_HEADER) || 'UNKNOWN',
    at: Date.now()
  })
}

const request = async (api: string, options: RequestInit = {}): Promise<Response> => {
  const method = options.method || 'GET'
  const response = await fetch(`${url}${api}`, options)
  recordResponseTiming(response, method, api)
  return response
}

const get = async <T = unknown>(api: string): Promise<T> => (await request(api)).json() as T
const getText = async (api: string): Promise<string> => (await request(api)).text()

const post = async <T = unknown>(api: string, obj: Record<string, unknown>): Promise<T> => (await request(api, {
  method: 'POST',
  body: JSON.stringify(obj),
  headers: {
    'Content-Type': 'application/json'
  }
})).json() as T

export const getAlbums = (): Promise<Record<string, AlbumData>> => get('albums')
export const getTag = (): Promise<TagData[]> => get('tag')

interface GetRankParams {
  uid: string
  difficulty: number
  platform: string
}

export const getRank = async ({ uid, difficulty, platform }: GetRankParams): Promise<RankEntry[]> =>
  (await get<Array<[number, number, number, string, string, string, string, string]>>(`rank/${uid}/${difficulty}/${platform}`))
    .map(([acc, score, lastRank, nickname, id, platform, character, elfin], index) =>
      ({ acc, score, lastRank, nickname, id, platform, character, elfin, url: `/player/${id}`, index, uid, difficulty })
    )

interface GetRankRawParams extends GetRankParams {
  id: string
}

export const getRankRaw = ({ uid, difficulty, platform, id }: GetRankRawParams): Promise<unknown> =>
  get(`rank/${uid}/${difficulty}/${platform}/${id}`)

export const getPlayer = (id: string): Promise<PlayerData> => get(`player/${id}`)

export const searchPlayer = (search: string): Promise<Array<[string, string]>> => get(`search/${search}`)

export const getLog = (): Promise<string> => getText('log')

export const getCE = (): Promise<CEData> => get('ce')

export const getDiffDiff = async (): Promise<DiffDiffEntry[]> =>
  (await get<Array<[string, number, string, number, number]>>('diffdiff'))
    .map(([uid, difficulty, level, absolute, relative]) => ({ uid, difficulty, level, absolute, relative }))

interface GetDiffHistoryParams {
  id: string
  start: number
  length: number
}

export const getDiffHistory = ({ id, start, length }: GetDiffHistoryParams): Promise<DiffHistoryEntry[]> =>
  get(`player/diffHistory/${id}?start=${start}&length=${length}`)

interface GetDiffDiffMusicParams {
  uid: string
  difficulty: number
}

export const getDiffDiffMusic = ({ uid, difficulty }: GetDiffDiffMusicParams): Promise<DiffDiffMusicEntry> =>
  get<DiffDiffMusicEntry>(`diffDiffMusic/${uid}/${difficulty}`)

interface GetRankUpdateTimeParams {
  uid: string
  difficulty: number
  platform: string
}

export const getRankUpdateTime = ({ uid, difficulty, platform }: GetRankUpdateTimeParams): Promise<number> =>
  get(`rankUpdateTime/${uid}/${difficulty}/${platform}`)

interface RefreshRankParams {
  uid: string
  difficulty: number
  platform: string
}

export const refreshRank = ({ uid, difficulty, platform }: RefreshRankParams): Promise<unknown> =>
  post('refreshRank', { uid, difficulty, platform })

const getMDMC = <T = unknown>(api: string): Promise<T> => get(`mdmc/${api}`)

export const mdmcGetAlbum = (): Promise<MdmcMusic[]> => getMDMC('musics')

interface MdmcGetRankParams {
  id: string
  difficulty: number
}

type MdmcRawRankEntry = [number, number, number, string, string, string, string]

export const mdmcGetRank = async ({ id: i, difficulty }: MdmcGetRankParams): Promise<MdmcRankEntry[]> =>
  (await getMDMC<MdmcRawRankEntry[]>(`rank/${i}/${difficulty}`))
    .map(([acc, score, lastRank, nickname, id, character, elfin], index) =>
      ({ acc, score, lastRank, nickname, id, character, elfin, url: `/mdmc/player/${id}`, index })
    )

export const mdmcGetPlayer = (id: string): Promise<MdmcPlayerData> => getMDMC(`player/${id}`)

export const mdmcSearchPlayer = (search: string): Promise<Array<[string, string]>> => getMDMC(`search/${search}`)

export const dispatch = (): Promise<DispatchResponse> => post('dispatch', {})

export const receipt = (url: string, data?: unknown): Promise<unknown> => post('receipt', { url, data })
