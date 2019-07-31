module.exports = api => {
  api.cache(true)

  const presets = ['@vue/app']

  return {
    presets
  }
}
