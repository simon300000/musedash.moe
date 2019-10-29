type MusicLang = {
  name: string,
  author: string
}

type Music = {
  uid: string,
  name: string,
  author: string,
  cover: string,
  levelDesigner: [string] | [string, string, string],
  difficulty: [number, number, number],
  ChineseS: MusicLang,
  ChineseT: MusicLang,
  English: MusicLang,
  Japanese: MusicLang,
  Korean: MusicLang
}

export type Musics = Music[]

type Album = {
  title: string,
  json: string,
  ChineseS: string,
  ChineseT: string,
  English: string,
  Japanese: string,
  Korean: string,
  music: Musics
}

export type Albums = Album[]

type APIResult = {
  play: {
    acc: number,
    bms_id: number,
    character_uid: string,
    combo: number,
    elfin_uid: string,
    hp: number,
    score: number,
    user_id: string
  },
  user: {
    nickname: string,
    user_id: string
  }
}

export type APIResults = APIResult[]
