const coverModules: Record<string, string> = import.meta.glob('./covers/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
})

const coverSet: Set<string> = new Set(
  Object.keys(coverModules).map(k => k.replace('./covers/', '').replace('.webp', '')),
)

export const loadCover = (name: string): string => {
  const key = `./covers/${name}.webp`
  if (coverSet.has(name)) {
    return coverModules[key]
  }
  return `/covers/${name}.webp`
}
