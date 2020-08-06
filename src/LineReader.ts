import { EventEmitter } from 'https://deno.land/std@0.63.0/node/events.ts'

export interface LineReader {
  on(event: 'error', listener: (data: Error) => void): this;
  on(event: 'close', listener: () => void): this;
  on(event: 'data', listener: (data: Uint8Array) => void): this;
  on(event: 'line', listener: (line: string) => void): this;

  once(event: 'error', listener: (data: Error) => void): this;
  once(event: 'close', listener: () => void): this;
  once(event: 'data', listener: (data: Uint8Array) => void): this;
  once(event: 'line', listener: (line: string) => void): this;

  emit(event: 'error', data: Error): boolean;
  emit(event: 'close'): boolean;
  emit(event: 'data', data: Uint8Array): boolean;
  emit(event: 'line', line: string): boolean;
}

export class LineReader extends EventEmitter {
  _r!: Deno.Reader & Deno.Closer
  _buf!: Uint8Array
  _line = ''
  _closed = false
  _decoder = new TextDecoder()


  constructor(reader: Deno.Reader & Deno.Closer, length: number = 1) {
    super()
    this._r = reader
    this._buf = new Uint8Array(length)
    this._read()
  }

  get closed() {
    return this._closed
  }

  private async _read() {
    while (true) {
      try {
        let result = await this._r.read(this._buf)
        if (!result) {
          this.close()
          break
        }

        this.emit('data', this._buf)

        const char = this._decoder.decode(this._buf)
        if (this._buf[0] !== 10 && this._buf[0] !== 13) {
          this._line = this._line + char
        } else {
          this.emit('line', this._line)
          this._line = ''
        }
      } catch (err) {
        this.emit('error', err)
        break
      }
    }
  }

  close() {
    if (this._closed) {
      return
    }
    this._closed = true
    this._r.close()
    this.emit('close')
  }
}
