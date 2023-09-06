import { Agent } from 'undici'

export const getAgent = () => new Agent({ connect: { timeout: 120_000 } })
