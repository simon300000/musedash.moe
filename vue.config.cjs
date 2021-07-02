module.exports = {
  lintOnSave: false,
  pages: {
    index: {
      entry: 'src/entry-client.js',
      template: 'index.html'
    }
  },
  devServer: {
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
