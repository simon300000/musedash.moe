const fs = require('fs')
const level = require('level')

let db = level(`./db`, { valueEncoding: 'json' })

let json = {}

db.createReadStream()
  .on('data', ({ key, value }) => {
    json[key] = value
  })
  .on('error', err => {
    console.log('Oh my!', err)
  })
  .on('close', () => {
    console.log('Stream closed')
  })
  .on('end', () => {
    fs.writeFileSync('db.json', JSON.stringify(json, undefined, 2))
    console.log('Stream ended')
  })

let dbPlayer = level(`./db/id`, { valueEncoding: 'json' })

let jsonPlayer = {}

dbPlayer.createReadStream()
  .on('data', ({ key, value }) => {
    jsonPlayer[key] = value
  })
  .on('error', err => {
    console.log('Oh my!', err)
  })
  .on('close', () => {
    console.log('Stream closed')
  })
  .on('end', () => {
    fs.writeFileSync('dbPlayer.json', JSON.stringify(jsonPlayer, undefined, 2))
    console.log('Stream ended')
  })
