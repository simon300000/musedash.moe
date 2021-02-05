import { join } from 'path'
import { promises as fs } from 'fs'
import { AlbumLang, Album, Music, MusicLang, MusicData, Albums } from './type'

const availableLocales = ['ChineseS', 'ChineseT', 'English', 'Japanese', 'Korean'] as const
export type AvailableLocales = typeof availableLocales[number]

async function parseFile<T>(file: string): Promise<T> {
  // eslint-disable-next-line no-control-regex
  return JSON.parse(String(await fs.readFile(join(__dirname, 'albums', `${file}.txt`))).replace(/\n/g, '').replace(/,( |\x09)*}/g, '}').replace(/,( |\x09)*]/g, ']'))
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

export default async (): Promise<Albums> => {
  const albums = (await readLocale<Album, AlbumLang>('albums'))
    .filter(album => album.jsonName)
    .map(({ title, jsonName, ChineseS, ChineseT, English, Japanese, Korean }) => ({ title, json: jsonName, ChineseS, ChineseT, English, Japanese, Korean }))
    .map(async object => {
      const music = (await readLocale<Music, MusicLang>(object.json))
        .map<MusicData>(({ uid, name, author, cover, difficulty1, difficulty2, difficulty3, difficulty4 = '0', ChineseS, ChineseT, English, Japanese, Korean, levelDesigner, levelDesigner1, levelDesigner2, levelDesigner3, levelDesigner4 }) => ({
          uid,
          name,
          author,
          cover,
          levelDesigner: levelDesigner ? [levelDesigner] : [levelDesigner1, levelDesigner2, levelDesigner3, levelDesigner4].filter(Boolean),
          difficulty: [difficulty1, difficulty2, difficulty3, difficulty4],
          ChineseS,
          ChineseT,
          English,
          Japanese,
          Korean
        }))
      return { ...object, music }
    })
  return Promise.all(albums)
}
