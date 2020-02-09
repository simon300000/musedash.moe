import { setFlagsFromString } from 'v8'

import parser from './albumParser'

import { rank, player, search } from './database'
import spider from './spider'

import api from './api'

setFlagsFromString('--max_old_space_size=8192')

;

(async () => {
  const albums = await parser()
  const music = [].concat(...albums
    .map(({ music }) => music))
  api({ albums, rank, player, search })
  spider({ music, player, search })
})()
