const parser = require('./albumParser')

const { rank, player, nickname } = require('./database')
const spider = require('./spider')

;
(async () => {
  let albums = await parser()
  let music = [].concat(...albums
    .map(({ music }) => music))
  spider({ music, rank, player, nickname })
})()
