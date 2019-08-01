import levelup, { LevelUp } from 'levelup' // eslint-disable-line
import leveldown from 'leveldown'
import encode from 'encoding-down'
import LRU = require('lru-cache')

const level = (file: string) => levelup(encode(leveldown(file), { valueEncoding: 'json' }))

class StandaloneLevelDatabase {
  db: LevelUp

  cache: LRU<string, any>

  constructor(db: LevelUp) {
    this.db = db
    this.cache = new LRU({
      max: 100
    })
  }

  put(key: string, value: any) {
    this.cache.set(key, value)
    return this.db.put(key, value)
  }

  async get(key: string) {
    let value = this.cache.get(key)
    if (!value) {
      value = await this.db.get(key).catch(() => undefined)
      this.cache.set(key, value)
    }
    return value
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

  cache: LRU<string, any>

  constructor({ name, db }) {
    this.name = name
    this.db = db
    this.cache = new LRU({
      max: 100
    })
  }

  put(key: string, value: any) {
    this.cache.set(`${this.name}_${key}`, value)
    return this.db.put(`${this.name}_${key}`, value)
  }

  async get(key) {
    let value = this.cache.get(`${this.name}_${key}`)
    if (!value) {
      value = await this.db.get(`${this.name}_${key}`).catch(() => undefined)
      this.cache.set(`${this.name}_${key}`, value)
    }
    return value
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
