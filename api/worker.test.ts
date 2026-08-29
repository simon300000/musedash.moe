import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { once } from 'node:events'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { isMainThread, parentPort, Worker, workerData } from 'node:worker_threads'

import { WorkerBroadcastChannel, WorkerJobsBroadcastChannel, startWorker } from './worker.js'

type BroadcastEvents = {
  request: [string]
  response: [string]
}

type JobEvents = {
  double: [number]
}

type WorkerSpecData = {
  role: 'api'
  fixture: 'broadcast' | 'job'
  channelName: string
}

const specData = workerData as WorkerSpecData | null

const withTimeout = <T>(promise: Promise<T>, label: string, timeout = 2_000) => new Promise<T>((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error(`Timed out waiting for ${label}`)), timeout)
  promise.then(value => {
    clearTimeout(timer)
    resolve(value)
  }, reason => {
    clearTimeout(timer)
    reject(reason)
  })
})

if (!isMainThread && specData?.fixture === 'broadcast') {
  const channel = new WorkerBroadcastChannel<BroadcastEvents>(specData.channelName)
  channel.on('request', message => channel.emit('response', message))
  parentPort?.postMessage('ready')
}

if (!isMainThread && specData?.fixture === 'job') {
  const jobs = new WorkerJobsBroadcastChannel<JobEvents>(specData.channelName)
  jobs.on('double', (finish, value) => {
    parentPort?.postMessage(value * 2)
    finish()
  })
  parentPort?.postMessage('ready')
}

if (isMainThread && process.env.WORKER_SPEC_FIXTURE === 'supervisor-exit') {
  startWorker(new URL('data:text/javascript,'), 'api')
} else if (isMainThread) {
  test('delivers emitted events to listeners in the current thread', () => {
    const channel = new WorkerBroadcastChannel<{ event: [string] }>(`worker-local-${randomUUID()}`)
    let received: string | undefined
    channel.on('event', message => {
      received = message
    })

    try {
      channel.emit('event', 'local message')
      assert.equal(received, 'local message')
    } finally {
      channel.close()
    }
  })

  test('broadcasts events between the main thread and a worker', { timeout: 5_000 }, async () => {
    const channelName = `worker-broadcast-${randomUUID()}`
    const channel = new WorkerBroadcastChannel<BroadcastEvents>(channelName)
    const response = new Promise<string>(resolve => channel.on('response', resolve))
    const worker = new Worker(new URL(import.meta.url), {
      workerData: { role: 'api', fixture: 'broadcast', channelName } satisfies WorkerSpecData
    })

    try {
      const [ready] = await withTimeout(once(worker, 'message'), 'broadcast worker readiness')
      assert.equal(ready, 'ready')
      channel.emit('request', 'worker message')
      assert.equal(await withTimeout(response, 'worker response'), 'worker message')
    } finally {
      await worker.terminate()
      channel.close()
    }
  })

  test('resolves a dispatched job after the worker finishes it', { timeout: 5_000 }, async () => {
    const channelName = `worker-job-${randomUUID()}`
    const jobs = new WorkerJobsBroadcastChannel<JobEvents>(channelName)
    const worker = new Worker(new URL(import.meta.url), {
      workerData: { role: 'api', fixture: 'job', channelName } satisfies WorkerSpecData
    })

    try {
      const [ready] = await withTimeout(once(worker, 'message'), 'job worker readiness')
      assert.equal(ready, 'ready')
      const result = withTimeout(once(worker, 'message'), 'job result')
      await withTimeout(jobs.dispatchJob('double', 21), 'job completion')
      assert.equal((await result)[0], 42)
    } finally {
      await worker.terminate()
      jobs.close()
    }
  })

  test('terminates the main process when a managed worker exits', { timeout: 5_000 }, async () => {
    const child = spawn(process.execPath, [fileURLToPath(import.meta.url)], {
      env: { ...process.env, WORKER_SPEC_FIXTURE: 'supervisor-exit' }
    })
    let stderr = ''
    child.stdout.resume()
    child.stderr.setEncoding('utf8')
    child.stderr.on('data', chunk => {
      stderr += chunk
    })

    try {
      const [code, signal] = await withTimeout(once(child, 'close'), 'supervisor fixture exit')
      assert.equal(signal, null)
      assert.equal(code, 1)
      assert.match(stderr, /Worker api exited with code 0; terminating main process/)
    } finally {
      if (child.exitCode === null && child.signalCode === null) {
        child.kill()
      }
    }
  })
}
