const level = require('level')
const LRU = require('lru-cache')

const cache = new LRU({
  max: 1000
})

class LevelDatabase {
  constructor({ name, db }) {
    this.name = name
    this.db = db
  }
  put(key, value) {
    cache.set(`${this.name}_${key}`, value)
    return this.db.put(`${this.name}_${key}`, value)
  }
  async get(key) {
    let value = cache.get(`${this.name}_${key}`)
    if (!value) {
      value = await this.db.get(`${this.name}_${key}`).catch(() => undefined)
      cache.set(`${this.name}_${key}`, value)
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

let rank = new LevelDatabase({ name: 'rank', db })

module.exports = {
  rank: {
    put: ({ uid, difficulty, platform, value }) => rank.put(`${uid}_${platform}_${difficulty}`, value),
    get: ({ uid, difficulty, platform }) => rank.get(`${uid}_${platform}_${difficulty}`)
  }
}
