import {
  connectWebSocket,
  isWebSocketCloseEvent,
  WebSocket,
} from "https://deno.land/std@0.63.0/ws/mod.ts"

import { EventEmitter } from 'https://deno.land/std@0.63.0/node/events.ts'

export interface Rcon {
  on(event: 'error', listener: (error: Error) => void): this;
  on(event: 'close', listener: (code: number, reason?: string) => void): this;
  on(event: 'connected', listener: () => void): this;
  on(event: 'failed', listener: (error: Error) => void): this;
  on(event: 'packet', listener: (data: any) => void): this;
  on(event: 'message', listener: (message: string) => void): this;
  on(event: 'warn', listener: (message: string) => void): this;

  once(event: 'error', listener: (error: Error) => void): this;
  once(event: 'close', listener: (code: number, reason?: string) => void): this;
  once(event: 'connected', listener: () => void): this;
  once(event: 'failed', listener: (error: Error) => void): this;
  once(event: 'packet', listener: (data: any) => void): this;
  once(event: 'message', listener: (message: string) => void): this;
  once(event: 'warn', listener: (message: string) => void): this;

  emit(event: 'error', error: Error): boolean;
  emit(event: 'close', code: number, reason?: string): boolean;
  emit(event: 'connected'): boolean;
  emit(event: 'failed', error: Error): boolean;
  emit(event: 'packet', data: any): boolean;
  emit(event: 'message', message: string): boolean;
  emit(event: 'warn', message: string): boolean;
}

export class Rcon extends EventEmitter {
  _sock?: WebSocket
  _connected = false

  get connected() {
    return this._connected
  }

  async connect(port: string, password: string, ip?: string) {
    try {
      this._sock = await connectWebSocket(`ws://${ip|| 'localhost'}:${port}/${password}`)
      this._connected = true
      this.emit('connected')
      this._poll()
    } catch (err) {
      this.emit('failed', err)
    }
  }

  async send(data: string) {
    if (!this._connected) {
      return
    }

    if (this._sock) {
      await this._sock.send(JSON.stringify({
        Identifier: -1,
        Message: data,
        Name: 'WebRcon'
      }))
    }
  }

  private async _poll() {
    if (!this._sock || !this._connected) {
      return
    }

    for await (const msg of this._sock) {
      if (!this._connected) {
        break
      }

      if (typeof msg === 'string') {
        try {
          const json = JSON.parse(msg)
          this.emit('packet', json)
          if (json !== undefined) {
            if (json.Message !== undefined && json.Message.length > 0) {
              this.emit('message', json.Message)
            }
          } else {
            this.emit('warn', 'Invalid JSON received')
          }
        } catch (err) {
          this.emit('error', err)
        }
      } else if (isWebSocketCloseEvent(msg)) {
        this.close(msg.code, msg.reason)
        break
      }
    }
  }

  close(code: number, reason?: string) {
    if (this._sock) {
      this._sock.close()
    }
    this._connected = false
    this.emit('close', code, reason)
  }
}
