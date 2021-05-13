'use strict'
import path from 'path'

const assetsPath = function(_path) {
  const assetsSubDirectory = 'static'

  return path.posix.join(assetsSubDirectory, _path)
}

export default { assetsPath }
