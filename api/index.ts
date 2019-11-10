import parser from './albumParser'

import { rank, player, search } from './database'
import spider from './spider'

import api from './api'

import { PARALLEL } from './config'

(async () => {
  const albums = await parser()
  const music = [].concat(...albums
    .map(({ music }) => music))
  api({ albums, rank, player, search })
  spider({ music, player, PARALLEL, search })
})()
