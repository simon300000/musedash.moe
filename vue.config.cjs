const path = require('path')

module.exports = {
  lintOnSave: false,
  chainWebpack: config => {
    const octiconsPath = path.resolve(__dirname, 'src/octicons/icons')

    config.module.rule('svg').exclude.add(octiconsPath)

    config.module
      .rule('octicons')
      .test(/\.svg$/)
      .include.add(octiconsPath)
      .end()
      .type('asset/source')
  },
  configureWebpack: {
    module: {
      rules: [{
        test: /\.js$/,
        loader: 'babel-loader'
        }]
    },
  },
  pages: {
    index: {
      entry: 'src/entry-client.js',
      template: 'index.html'
    }
  },
  devServer: {
    static: {
      directory: path.resolve(__dirname, 'src/covers'),
      publicPath: '/covers'
    },
    proxy: {
      '^/api': {
        target: 'https://api.musedash.moe', // use production api
        // target: 'http://0.0.0.0:8301', // local api
        changeOrigin: true,
        pathRewrite: {
          '^/api/': '/'
        }
      }
    }
  }
}
