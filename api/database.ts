import levelup, { LevelUp } from 'levelup'
import leveldown from 'leveldown'
import encode from "encoding-down"
import LRU = require('lru-cache')

const level = (file: String) => levelup(encode(leveldown('./db1'), { valueEncoding: 'json' }))

class StandaloneLevelDatabase {
  db: LevelUp
  cache: LRU<String, any>
  constructor(db: LevelUp) {
    this.db = db
    this.cache = new LRU({
      max: 100
    })
  }
  put(key: String, value: any) {
    this.cache.set(key, value)
    return this.db.put(key, value)
  }
  async get(key: String) {
    let value = this.cache.get(key)
    if (!value) {
      value = await this.db.get(key).catch(() => undefined)
      this.cache.set(key, value)
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

class LevelDatabase {
  db: LevelUp
  name: String;
  cache: LRU<String, any>
  constructor({ name, db }) {
    this.name = name
    this.db = db
    this.cache = new LRU({
      max: 100
    })
  }
  put(key: String, value: any) {
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

let db = level('./db')
let iddb = level('./db/id')
let namedb = level('./db/name')

let rank = new LevelDatabase({ name: 'rank', db })

let player = new StandaloneLevelDatabase(iddb)
let nickname = new StandaloneLevelDatabase(namedb)

module.exports = {
  player,
  nickname,
  rank: {
    put: ({ uid, difficulty, platform, value }) => rank.put(`${uid}_${platform}_${difficulty}`, value),
    get: ({ uid, difficulty, platform }) => rank.get(`${uid}_${platform}_${difficulty}`)
  }
}
