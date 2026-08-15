import { performance } from 'node:perf_hooks'
import { Buffer } from 'node:buffer'

export type SearchEntry = readonly [id: string, name: string]
export type SearchResult = [name: string, id: string]

export type SearchIndexStats = {
  rows: number
  uniqueGrams: number
  postings: number
  csrBytes: number
  textBytes: number
  buildMs: number
  installed: boolean
  version: number
}

type SearchIndexBuildOptions = {
  invalidateOnFailure?: boolean
}

type SearchSnapshot = {
  idBytes: Buffer
  idOffsets: Uint32Array
  idExceptions: Map<number, string>
  nameBytes: Buffer
  nameOffsets: Uint32Array
  nameExceptions: Map<number, string>
  normalizedNames: string[]
  gramToId: Map<string, number>
  offsets: Uint32Array
  postings: Uint32Array
}

const MAX_UINT32 = 0xffffffff
const INITIAL_TEXT_BYTES = 1024
const INITIAL_TEXT_OFFSETS = 1024

const yieldToEventLoop = () => new Promise<void>(resolve => setImmediate(resolve))

const hasUnpairedSurrogate = (value: string) => {
  for (let index = 0; index < value.length; index++) {
    const code = value.charCodeAt(index)
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(index + 1)
      if (next >= 0xdc00 && next <= 0xdfff) {
        index++
      } else {
        return true
      }
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      return true
    }
  }
  return false
}

class PackedStrings {
  private bytes = Buffer.allocUnsafe(INITIAL_TEXT_BYTES)
  private offsets = new Uint32Array(INITIAL_TEXT_OFFSETS)
  private exceptions = new Map<number, string>()
  private byteLength = 0
  private offsetLength = 1

  append(value: string) {
    const rowIndex = this.offsetLength - 1
    if (hasUnpairedSurrogate(value)) {
      this.exceptions.set(rowIndex, value)
    }
    const valueBytes = Buffer.byteLength(value, 'utf8')
    const nextByteLength = this.byteLength + valueBytes
    if (nextByteLength > MAX_UINT32) {
      throw new RangeError('Search index text exceeds Uint32 offset capacity')
    }
    this.growBytes(nextByteLength)
    this.growOffsets(this.offsetLength + 1)
    const written = this.bytes.write(value, this.byteLength, valueBytes, 'utf8')
    if (written !== valueBytes) {
      throw new Error('Search index text packing length mismatch')
    }
    this.byteLength = nextByteLength
    this.offsets[this.offsetLength++] = this.byteLength
  }

  finish() {
    return {
      bytes: this.bytes.subarray(0, this.byteLength),
      offsets: this.offsets.subarray(0, this.offsetLength),
      exceptions: this.exceptions
    }
  }

  private growBytes(required: number) {
    if (required <= this.bytes.length) return
    let capacity = this.bytes.length
    while (capacity < required) capacity = Math.min(MAX_UINT32, capacity * 2)
    const bytes = Buffer.allocUnsafe(capacity)
    this.bytes.copy(bytes, 0, 0, this.byteLength)
    this.bytes = bytes
  }

  private growOffsets(required: number) {
    if (required <= this.offsets.length) return
    let capacity = this.offsets.length
    while (capacity < required) capacity *= 2
    const offsets = new Uint32Array(capacity)
    offsets.set(this.offsets.subarray(0, this.offsetLength))
    this.offsets = offsets
  }
}

const uniqueTrigrams = (value: string) => {
  const grams = new Set<string>()
  for (let index = 0; index + 3 <= value.length; index++) {
    grams.add(value.slice(index, index + 3))
  }
  return grams
}

const intersectSorted = (left: Uint32Array, right: Uint32Array) => {
  const result = new Uint32Array(Math.min(left.length, right.length))
  let leftIndex = 0
  let rightIndex = 0
  let resultLength = 0

  while (leftIndex < left.length && rightIndex < right.length) {
    const leftValue = left[leftIndex]
    const rightValue = right[rightIndex]
    if (leftValue === rightValue) {
      result[resultLength++] = leftValue
      leftIndex++
      rightIndex++
    } else if (leftValue < rightValue) {
      leftIndex++
    } else {
      rightIndex++
    }
  }

  return result.subarray(0, resultLength)
}

export const parseSearchQuery = (query: string) => [
  ...new Set(query
    .toLowerCase()
    .split(' ')
    .filter(Boolean))
]

export class TrigramSearchIndex {
  private snapshot?: SearchSnapshot
  private requestedBuild = 0
  private activeVersion = 0
  private readonly yieldEvery: number

  constructor({ yieldEvery = 4096 }: { yieldEvery?: number } = {}) {
    this.yieldEvery = yieldEvery
  }

  get ready() {
    return this.snapshot !== undefined
  }

  get version() {
    return this.activeVersion
  }

  async rebuild(entries: AsyncIterable<SearchEntry> | Iterable<SearchEntry>, { invalidateOnFailure = false }: SearchIndexBuildOptions = {}): Promise<SearchIndexStats> {
    const build = ++this.requestedBuild
    const started = performance.now()
    let snapshot: SearchSnapshot
    try {
      snapshot = await this.buildSnapshot(entries)
    } catch (reason) {
      if (invalidateOnFailure && build === this.requestedBuild) {
        this.snapshot = undefined
        this.activeVersion++
      }
      throw reason
    }
    const installed = build === this.requestedBuild

    if (installed) {
      this.snapshot = snapshot
      this.activeVersion++
    }

    return {
      rows: snapshot.normalizedNames.length,
      uniqueGrams: snapshot.gramToId.size,
      postings: snapshot.postings.length,
      csrBytes: snapshot.offsets.byteLength + snapshot.postings.byteLength,
      textBytes: snapshot.idBytes.byteLength + snapshot.idOffsets.byteLength + snapshot.nameBytes.byteLength + snapshot.nameOffsets.byteLength,
      buildMs: performance.now() - started,
      installed,
      version: this.activeVersion
    }
  }

  search(query: string): SearchResult[] | undefined {
    const terms = parseSearchQuery(query)
    if (!terms.length) {
      return []
    }

    const snapshot = this.snapshot
    if (!snapshot) {
      return undefined
    }

    const gramIds = new Set<number>()
    let hasLongTerm = false

    for (const term of terms) {
      if (term.length < 3) {
        continue
      }
      hasLongTerm = true
      for (const gram of uniqueTrigrams(term)) {
        const gramId = snapshot.gramToId.get(gram)
        if (gramId === undefined) {
          return []
        }
        gramIds.add(gramId)
      }
    }

    if (!hasLongTerm) {
      const result: SearchResult[] = []
      for (let rowIndex = 0; rowIndex < snapshot.normalizedNames.length; rowIndex++) {
        if (terms.every(term => snapshot.normalizedNames[rowIndex].includes(term))) {
          result.push(this.resultAt(snapshot, rowIndex))
        }
      }
      return result
    }

    const lists: Uint32Array[] = []
    for (const gramId of gramIds) {
      lists.push(snapshot.postings.subarray(snapshot.offsets[gramId], snapshot.offsets[gramId + 1]))
    }
    lists.sort((left, right) => left.length - right.length)

    let candidates = lists[0]
    for (let index = 1; index < lists.length && candidates.length; index++) {
      candidates = intersectSorted(candidates, lists[index])
    }

    const result: SearchResult[] = []
    for (const rowIndex of candidates) {
      if (terms.every(term => snapshot.normalizedNames[rowIndex].includes(term))) {
        result.push(this.resultAt(snapshot, rowIndex))
      }
    }
    return result
  }

  private async buildSnapshot(entries: AsyncIterable<SearchEntry> | Iterable<SearchEntry>): Promise<SearchSnapshot> {
    const ids = new PackedStrings()
    const names = new PackedStrings()
    const normalizedNames: string[] = []

    for await (const [id, name] of entries) {
      if (typeof id !== 'string' || typeof name !== 'string') {
        throw new TypeError('Search index entries must contain string ids and names')
      }
      ids.append(id)
      names.append(name)
      normalizedNames.push(name.toLowerCase())
      if (normalizedNames.length > MAX_UINT32) {
        throw new RangeError('Search index has more rows than Uint32 postings support')
      }
      await this.maybeYield(normalizedNames.length)
    }

    const { bytes: idBytes, offsets: idOffsets, exceptions: idExceptions } = ids.finish()
    const { bytes: nameBytes, offsets: nameOffsets, exceptions: nameExceptions } = names.finish()

    const gramToId = new Map<string, number>()
    const gramCounts: number[] = []
    let postingsTotal = 0

    for (let rowIndex = 0; rowIndex < normalizedNames.length; rowIndex++) {
      for (const gram of uniqueTrigrams(normalizedNames[rowIndex])) {
        let gramId = gramToId.get(gram)
        if (gramId === undefined) {
          gramId = gramCounts.length
          gramToId.set(gram, gramId)
          gramCounts.push(1)
        } else {
          gramCounts[gramId]++
        }
        postingsTotal++
        if (postingsTotal > MAX_UINT32) {
          throw new RangeError('Search index has more postings than Uint32 CSR supports')
        }
      }
      await this.maybeYield(rowIndex + 1)
    }

    const offsets = new Uint32Array(gramCounts.length + 1)
    for (let gramId = 0; gramId < gramCounts.length; gramId++) {
      offsets[gramId + 1] = offsets[gramId] + gramCounts[gramId]
    }

    const postings = new Uint32Array(postingsTotal)
    const cursors = offsets.slice(0, gramCounts.length)
    for (let rowIndex = 0; rowIndex < normalizedNames.length; rowIndex++) {
      for (const gram of uniqueTrigrams(normalizedNames[rowIndex])) {
        const gramId = gramToId.get(gram)
        if (gramId === undefined) {
          throw new Error('Search index trigram disappeared during construction')
        }
        postings[cursors[gramId]++] = rowIndex
      }
      await this.maybeYield(rowIndex + 1)
    }

    return { idBytes, idOffsets, idExceptions, nameBytes, nameOffsets, nameExceptions, normalizedNames, gramToId, offsets, postings }
  }

  private resultAt(snapshot: SearchSnapshot, rowIndex: number): SearchResult {
    const name = snapshot.nameExceptions.get(rowIndex) ?? snapshot.nameBytes.toString('utf8', snapshot.nameOffsets[rowIndex], snapshot.nameOffsets[rowIndex + 1])
    const id = snapshot.idExceptions.get(rowIndex) ?? snapshot.idBytes.toString('utf8', snapshot.idOffsets[rowIndex], snapshot.idOffsets[rowIndex + 1])
    return [name, id]
  }

  private async maybeYield(position: number) {
    if (this.yieldEvery > 0 && position % this.yieldEvery === 0) {
      await yieldToEventLoop()
    }
  }
}
