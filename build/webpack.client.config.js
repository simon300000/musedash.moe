import { merge } from 'webpack-merge'
import baseConfig from './webpack.base.config.js'
import VueSSRClientPlugin from 'vue-server-renderer/client-plugin.js'

import { InjectManifest } from 'workbox-webpack-plugin'

export default merge(baseConfig, {
  entry: './src/entry-client.js',
  plugins: [
    new VueSSRClientPlugin(),
    new InjectManifest({
      swSrc: './src/service-worker.js',
    })
  ]
})
