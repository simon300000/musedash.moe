export const loadCover = name => {
  try {
    return require(`@/covers/${name}.webp`)
  } catch (_) {
    return `/covers/${name}.webp`
  }
}
