import parser from './albumParser.js'

import { rank, player, search } from './database.js'
import spider from './spider.js'

import api from './api.js'

(async () => {
  const albums = await parser()
  const music = [].concat(...albums
    .map(({ music }) => music))
  api({ albums, rank, player, search })
  spider({ music, player, search })
})()
