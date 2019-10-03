import levelup, { LevelUp } from 'levelup' // eslint-disable-line
import leveldown from 'leveldown'
import encode from 'encoding-down'

const level = (file: string) => levelup(encode(leveldown(file), { valueEncoding: 'json' }))

export class StandaloneLevelDatabase {
  db: LevelUp

  constructor(db: LevelUp) {
    this.db = db
  }

  put(key: string, value: any) {
    return this.db.put(key, value)
  }

  get(key: string) {
    return this.db.get(key).catch(() => undefined)
  }
  createValueStream() {
    return this.db.createValueStream()
  }
  createReadStream() {
    return this.db.createReadStream()
  }
  batch() {
    return this.db.batch()
  }
  clear() {
    const batch = this.db.batch()
    return new Promise(resolve => this.db.createKeyStream()
      .on('data', key => batch.del(key))
      .on('close', async () => resolve(await batch.write())))
  }
}

export class LevelDatabase {
  db: LevelUp

  name: string

  constructor({ name, db }) {
    this.name = name
    this.db = db
  }

  put(key: string, value: any) {
    return this.db.put(`${this.name}_${key}`, value)
  }

  get(key) {
    return this.db.get(`${this.name}_${key}`).catch(() => undefined)
  }
}

const db = level('./db')
const iddb = level('./db/id')
const searchdb = level('./db/search')

const rankdb = new LevelDatabase({ name: 'rank', db })

export const player = new StandaloneLevelDatabase(iddb)
export const search = new StandaloneLevelDatabase(searchdb)

export const rank = {
  put: ({ uid, difficulty, platform, value }) => rankdb.put(`${uid}_${platform}_${difficulty}`, value),
  get: ({ uid, difficulty, platform }) => rankdb.get(`${uid}_${platform}_${difficulty}`)
}
