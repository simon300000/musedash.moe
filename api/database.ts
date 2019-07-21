const level = require('level')
const LRU = require('lru-cache')

class StandaloneLevelDatabase {
  constructor(db) {
    this.db = db
    this.cache = new LRU({
      max: 100
    })
  }
  put(key, value) {
    this.cache.set(key, value)
    return this.db.put(key, value)
  }
  async get(key) {
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
  constructor({ name, db }) {
    this.name = name
    this.db = db
    this.cache = new LRU({
      max: 100
    })
  }
  put(key, value) {
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

let db = level(`./db`, { valueEncoding: 'json' })
let iddb = level(`./db/id`, { valueEncoding: 'json' })
let namedb = level(`./db/name`, { valueEncoding: 'json' })

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
