const coverContext = import.meta.webpackContext('./covers', {
  recursive: false,
  regExp: /\.webp$/
})
const coverSet = new Set(coverContext.keys())

export const loadCover = name => {
  const key = `./${name}.webp`
  if (coverSet.has(key)) {
    return coverContext(key)
  }
  return `/covers/${name}.webp`
}
