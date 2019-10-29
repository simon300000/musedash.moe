module.exports = api => {
  api.cache(true)

  const presets = ['@vue/cli-plugin-babel/preset']
  const plugins = ['@babel/plugin-proposal-optional-chaining', '@babel/plugin-transform-runtime']

  return {
    presets,
    plugins
  }
}
