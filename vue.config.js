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
        target: 'https://api.musedash.moe',
        changeOrigin: true,
        pathRewrite: {
          '^/api/': '/'
        }
      }
    }
  }
}
