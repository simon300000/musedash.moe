import parser from './albumParser'

import { rank, player, nickname } from './database'
import spider from './spider'

import api from './api'

(async () => {
  const albums = await parser()
  const music = [].concat(...albums
    .map(({ music }) => music))
  api({ albums, rank, player })
  spider({ music, rank, player, nickname })
})()
