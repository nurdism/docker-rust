import { EventEmitter } from 'https://deno.land/std@0.63.0/node/events.ts'
import { LineReader } from './LineReader.ts'

export interface ChildProcess {
  on(event: 'error', listener: (error: Error) => void): this;
  on(event: 'exit', listener: (success: boolean, code: number, signal?: number) => void): this;

  once(event: 'error', listener: (error: Error) => void): this;
  once(event: 'exit', listener: (success: boolean, code: number, signal?: number) => void): this;

  emit(event: 'error', error: Error): boolean;
  emit(event: 'exit', success: boolean, code: number, signal?: number): boolean;
}

const encoder = new TextEncoder()

export class ChildProcess extends EventEmitter {
  private _proc!: Deno.Process
  private _exited = false

  stdout!: LineReader
  stderr!: LineReader

  constructor(cmd: string[], env: { [index: string]: string; }) {
    super()
    this._proc = Deno.run({ cmd, env, stdout: 'piped', stderr: 'piped' })

    this.stdout = new LineReader(this._proc.stdout!)
    this.stderr = new LineReader(this._proc.stderr!)

    this._status()
  }

  get exited() {
    return this._exited
  }

  get pid() {
    return this._proc.pid
  }

  get rid() {
    return this._proc.rid
  }

  kill(signo: number) {
    this._proc.kill(signo)
  }

  async write(p: Uint8Array) {
    if (this._proc.stdin) {
      return await this._proc.stdin.write(p)
    }

    return 0
  }

  async writeText(str: string) {
    if (this._proc.stdin) {
      return await this._proc.stdin.write(encoder.encode(str))
    }
    return 0
  }

  async _status() {
    const { success, code, signal } = await this._proc.status()
    this._exit(success, code, signal)
  }

  async _exit(success: boolean, code: number, signal?: number) {
    if (this._exited) {
      return
    }

    this._exited = true
    this.stdout.close()
    this.stderr.close()

    if (this._proc.stdin) {
      this._proc.stdin.close()
    }

    this._proc.close()

    this.emit('exit', success, code, signal)
  }
}
