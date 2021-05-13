import ora from 'ora'
import chalk from 'chalk'
import webpackServerConfig from './webpack.server.config.js'
import webpackClientConfig from './webpack.client.config.js'
import path from 'path'
import rm from 'rimraf'
import webpack from 'webpack'

import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

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
