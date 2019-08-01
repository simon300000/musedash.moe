import levelup, { LevelUp } from 'levelup' // eslint-disable-line
import leveldown from 'leveldown'
import encode from 'encoding-down'

const level = (file: string) => levelup(encode(leveldown(file), { valueEncoding: 'json' }))

class StandaloneLevelDatabase {
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
  keyList() {
    let keys = []
    return new Promise(resolve => this.db.createKeyStream()
      .on('data', key => keys.push(key))
      .on('close', () => resolve(keys)))
  }
  clear() {
    const batch = this.db.batch()
    return new Promise(resolve => this.db.createKeyStream()
      .on('data', key => batch.del(key))
      .on('close', async () => resolve(await batch.write())))
  }
}

class LevelDatabase {
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

  clear() {
    const batch = this.db.batch()
    return new Promise(resolve => this.db.createKeyStream()
      .on('data', key => batch.del(key))
      .on('close', () => resolve(batch.write())))
  }
}

const db = level('./db')
const iddb = level('./db/id')

const rankdb = new LevelDatabase({ name: 'rank', db })

export const player = new StandaloneLevelDatabase(iddb)

export const rank = {
  put: ({ uid, difficulty, platform, value }) => rankdb.put(`${uid}_${platform}_${difficulty}`, value),
  get: ({ uid, difficulty, platform }) => rankdb.get(`${uid}_${platform}_${difficulty}`)
}
