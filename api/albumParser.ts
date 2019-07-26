import { join } from 'path'
import { promises as fs } from 'fs'

const availableLocales = ['ChineseS', 'ChineseT', 'English', 'Japanese', 'Korean']

const parseFile = async (file: string) => JSON.parse(String(await fs.readFile(join(__dirname, 'albums', `${file}.txt`))))

const readLocale = async (file: string) => {
  let content = await parseFile(file)
  let locales = await Promise.all(availableLocales
    .map(locale => parseFile(`${file}_${locale}`)))
  return content
    .map((object, index) => {
      availableLocales.forEach((locale, localeIndex) => {
        object[locale] = locales[localeIndex][index]
      })
      return object
    })
}

export default async () => {
  let albums = (await readLocale('albums'))
    .filter(album => album.jsonName)
    .map(({ title, jsonName, ChineseS, ChineseT, English, Japanese, Korean }) => ({ title, json: jsonName, ChineseS, ChineseT, English, Japanese, Korean }))
    .map(async object => {
      let music = (await readLocale(object.json))
        .map(({ uid, name, author, cover, difficulty1, difficulty2, difficulty3, ChineseS, ChineseT, English, Japanese, Korean }) => ({
          uid,
          name,
          author,
          cover,
          difficulty: [Number(difficulty1), Number(difficulty2), Number(difficulty3)],
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
