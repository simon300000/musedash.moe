const ora = require('ora')
const chalk = require('chalk')
const webpackServerConfig = require('./webpack.server.config')
const webpackClientConfig = require('./webpack.client.config')
const path = require('path')
const rm = require('rimraf')
const webpack = require('webpack')

const webpackBuild = async config => new Promise((resolve, reject) => webpack(config, (err, stats) => {
  if (err) {
    reject(err)
  }
  resolve(stats)
}))

const logStats = stats => {
  process.stdout.write(stats.toString({
    colors: true,
    modules: false,
    children: false,
    chunks: false,
    chunkModules: false
  }) + '\n\n')

  if (stats.hasErrors()) {
    console.log(chalk.red('  Build failed with errors.\n'))
    process.exit(1)
  }
}

let spinner = ora('Building...')
spinner.start()

rm(path.resolve(__dirname, '../dist'), async err => {
  if (err) {
    throw err
  }
  const serverStats = await webpackBuild(webpackServerConfig)
  logStats(serverStats)

  const clientStats = await webpackBuild(webpackClientConfig)
  spinner.stop()

  logStats(clientStats)

  console.log(chalk.cyan('Build complete.\n'))
})
