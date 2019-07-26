import parser from './albumParser'

import { rank, player, nickname } from './database'
import spider from './spider'

(async () => {
  const albums = await parser()
  const music = [].concat(...albums
    .map(({ music }) => music))
  spider({ music, rank, player, nickname })
})()
