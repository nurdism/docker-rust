import { EventEmitter } from 'https://deno.land/std@0.63.0/node/events.ts'

export interface Reader {
  on(event: 'error', listener: (data: Error) => void): this;
  on(event: 'close', listener: () => void): this;
  on(event: 'data', listener: (data: Uint8Array) => void): this;

  once(event: 'error', listener: (data: Error) => void): this;
  once(event: 'close', listener: () => void): this;
  once(event: 'data', listener: (data: Uint8Array) => void): this;

  emit(event: 'error', data: Error): boolean;
  emit(event: 'close'): boolean;
  emit(event: 'data', data: Uint8Array): boolean;
}

export class Reader extends EventEmitter {
  _r!: Deno.Reader
  _buf!: Uint8Array

  constructor(reader: Deno.Reader, length: number = 1) {
    super()
    this._r = reader
    this._buf = new Uint8Array(length)
    this._read()
  }

  private async _read() {
    while (true) {
      try {
        let result = await this._r.read(this._buf)
        if (!result) {
          this.emit('close')
          break
        }

        this.emit('data', this._buf)
      } catch (err) {
        this.emit('error', err)
        break
      }
    }
  }
}
