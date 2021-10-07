export const loadCover = name => {
  try {
    return require(`@/covers/${name}.png`)
  } catch (_) {
    return `/covers/${name}.png`
  }
}
