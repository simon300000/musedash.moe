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
        // target: 'https://api.musedash.moe',
        target: 'http://0.0.0.0:8301',
        changeOrigin: true,
        pathRewrite: {
          '^/api/': '/'
        }
      }
    }
  }
}
