import { BroadcastChannel, isMainThread, Worker, workerData } from 'node:worker_threads'
import type { WorkerOptions } from 'node:worker_threads'
import { EventEmitter } from 'node:events'

const workerRoles = ['diffdiff', 'api', 'mdmc', 'master'] as const

type WorkerRole = typeof workerRoles[number]
type ChildWorkerRole = Exclude<WorkerRole, 'master'>

type RoleWorkerData = {
  role: ChildWorkerRole
}

const isWorkerRole = (role: unknown): role is WorkerRole =>
  typeof role === 'string' && workerRoles.some(workerRole => workerRole === role)

const isChildWorkerRole = (role: unknown): role is ChildWorkerRole => isWorkerRole(role) && role !== 'master'

const requestedRole = (workerData as Partial<RoleWorkerData> | null)?.role

if (!isMainThread && !isChildWorkerRole(requestedRole)) {
  throw new Error(`Unknown worker role: ${String(requestedRole)}`)
}

const currentWorkerRole: WorkerRole = isMainThread ? 'master' : requestedRole as ChildWorkerRole

export const isCurrentWorkerRole = (role: WorkerRole) => currentWorkerRole === role

const workerDataFor = (role: ChildWorkerRole): RoleWorkerData => ({ role })

export const startWorker = (filename: string | URL, role: ChildWorkerRole, options: Omit<WorkerOptions, 'workerData'> = {}) => {
  if (!isMainThread) {
    throw new Error('startWorker can only be called from the main thread')
  }
  const worker = new Worker(filename, { ...options, workerData: workerDataFor(role) })
  worker.on('error', reason => {
    console.error(`Worker ${role} failed:`, reason)
  })
  worker.on('exit', code => {
    console.error(`Worker ${role} exited with code ${code}; terminating main process`)
    process.exit(1)
  })
  return worker
}

export class WorkerBroadcastChannel<EventMap extends Record<PropertyKey, any[]>> {
  private channel: BroadcastChannel
  private emitter = new EventEmitter()

  constructor(name: string) {
    this.channel = new BroadcastChannel(name)

    this.channel.onmessage = message => {
      const { name, data } = message.data
      this.emitter.emit(name, ...data)
    }
  }

  emit = <K extends Extract<keyof EventMap, string>>(name: K, ...data: EventMap[K]) => {
    const message = { name, data }
    this.channel.postMessage(message)
    return this.emitter.emit(name, ...data)
  }

  on = <K extends Extract<keyof EventMap, string>>(name: K, listener: (...data: EventMap[K]) => void) =>
    this.emitter.on(name, listener)

  close = () => this.channel.close()
}

export class WorkerJobsBroadcastChannel<JobMap extends Record<PropertyKey, any[]>> {
  private workerJobs: Map<number, () => void> = new Map()
  private broadcastChannel: WorkerBroadcastChannel<{ [K in keyof JobMap]: [number, ...args: JobMap[K]] }>
  private finishChannel: WorkerBroadcastChannel<{ finish: [number] }>

  constructor(name: string) {
    this.broadcastChannel = new WorkerBroadcastChannel(name)
    this.finishChannel = new WorkerBroadcastChannel(name)

    this.finishChannel.on('finish', key => {
      const resolve = this.workerJobs.get(key)
      if (resolve) {
        resolve()
        this.workerJobs.delete(key)
      }
    })
  }

  dispatchJob = <K extends Extract<keyof JobMap, string>>(key: K, ...args: JobMap[K]) => {
    const jobKey = Math.random()
    const promise = new Promise<void>(resolve => {
      this.workerJobs.set(jobKey, resolve)
    })
    this.broadcastChannel.emit(key, jobKey, ...args)
    return promise
  }

  on = <K extends Extract<keyof JobMap, string>>(key: K, listener: (finish: () => void, ...args: JobMap[K]) => void) =>
    this.broadcastChannel.on(key, (jobKey: number, ...args: JobMap[K]) => {
      listener(() => this.finishChannel.emit('finish', jobKey), ...args)
    })

  close = () => {
    this.broadcastChannel.close()
    this.finishChannel.close()
  }
}
