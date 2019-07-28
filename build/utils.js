'use strict'
const path = require('path')

exports.assetsPath = function(_path) {
  const assetsSubDirectory = 'static'

  return path.posix.join(assetsSubDirectory, _path)
}
