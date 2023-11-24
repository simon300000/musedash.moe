import { join, dirname } from 'path'
import { promises as fs } from 'fs'
import { AlbumLang, Album, Music, MusicLang, MusicData, Albums, Musics } from './type.js'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export const availableLocales = ['ChineseS', 'ChineseT', 'English', 'Japanese', 'Korean'] as const
export type AvailableLocales = typeof availableLocales[number]

async function parseFile<T>(file: string): Promise<T> {
  // eslint-disable-next-line no-control-regex
  return JSON.parse(String(await fs.readFile(join(__dirname, 'albums', `${file}.json`))).split('\n').filter(line => !line.startsWith('//')).join('').replace(/,( |\x09)*}/g, '}').replace(/,( |\x09)*]/g, ']'))
}

async function readLocale<S, T>(file: string) {
  const content = await parseFile<S[]>(file)
  const locales = await Promise.all(availableLocales
    .map(locale => parseFile<T[]>(`${file}_${locale}`)))
  return content
    .map((object, index) => {
      availableLocales.forEach((locale, localeIndex) => {
        object[locale] = locales[localeIndex][index]
      })
      return object
    })
}

export const albums = async (): Promise<Albums> => {
  const w = (await readLocale<Album, AlbumLang>('albums'))
    .filter(album => album.jsonName)
    .map(({ title, jsonName, ChineseS, ChineseT, English, Japanese, tag, Korean }) => ({ title, json: jsonName, ChineseS, ChineseT, English, Japanese, Korean, tag }))
    .map(async object => {
      const music = (await readLocale<Music, MusicLang>(object.json))
        .map<MusicData>(({ uid, name, author, cover, difficulty1, difficulty2, difficulty3, difficulty4 = '0', difficulty5 = '0', ChineseS, ChineseT, English, Japanese, Korean, levelDesigner, levelDesigner1, levelDesigner2, levelDesigner3, levelDesigner4, levelDesigner5, bpm }) => ({
          uid,
          name,
          author,
          cover,
          bpm,
          levelDesigner: levelDesigner ? [levelDesigner] : [levelDesigner1, levelDesigner2, levelDesigner3, levelDesigner4, levelDesigner5],
          difficulty: [difficulty1, difficulty2, difficulty3, difficulty4, difficulty5],
          ChineseS,
          ChineseT,
          English,
          Japanese,
          Korean
        }))
      return { ...object, music }
    })
  return Promise.all(w)
}

export const musics = async (): Promise<Musics> => (await albums()).flatMap(({ music }) => music)
