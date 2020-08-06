import { onSignal } from 'https://deno.land/std@0.63.0/signal/mod.ts'
import { Rcon } from './Rcon.ts'
import { ChildProcess } from './ChildProcess.ts'
import { LineReader } from './LineReader.ts'
import { parse, filter } from './Utils.ts'

const env = Deno.env.toObject()
const rcon = new Rcon()
const process = new ChildProcess(parse(Deno.args[0]), env)
const stdin = new LineReader(Deno.stdin)

const { RCON_IP, RCON_PORT, RCON_PASS } = env

const connect = () => {
  setTimeout(() => {
    rcon.connect(RCON_PORT, RCON_PASS, RCON_IP)
  }, 5000)
}

const kill = () => {
  if (rcon.connected) {
    rcon.close(0)
  }
  process.kill(Deno.Signal.SIGINT)
}

const update = async () => {
  try {
    console.log('Checing for new version...')

    const decoder = new TextDecoder('utf-8')
    const data = await Deno.readFile('latest.json')
    const current = JSON.parse(decoder.decode(data))
    console.log(`Current version is: ${current.version}`)

    const response = await fetch('https://umod.org/games/rust/latest.json')
    const latest = await response.json()
    console.log(`Latest version is: ${latest.version}`)

    if (current.version !== latest.version) {
      console.log(`New verson found '${latest.version}', restarting server!`)
      kill()
    } else {
      console.log(`No new versons found...`)
      setTimeout(() => {
        update()
      }, 1000 * 60 * 60) // check every hour
    }
  } catch (err) {
    console.log(err)
    setTimeout(() => {
      update()
    }, 60000)
  }
}

rcon.on('failed', err => {
  console.log('failed to connect to rcon, retrying:', err)
  connect()
})

rcon.on('connected', () => {
  update()
  rcon.send('status')
})

rcon.on('close', (code, reason) => {
  if (code !== 0) {
    console.log('RCON closed, retrying:', { code, reason })
    connect()
  }
})

rcon.on('message', (message) => {
  if (filter(message)) {
    console.log(message)
  }
})

process.stdout.on('line', (line) => {
  if (line.match(/server\sstartup\scomplete/gi)) {
    console.log('Connecting to RCON')
    connect()
  }

  if (filter(line) && !rcon.connected) {
    console.log(line)
  }
})

process.stderr.on('line', (line) => {
  if (filter(line)) {
    console.log(line)
  }
})

stdin.on('line', (line) => {
  if (line.trim() === 'quit') {
    kill()
  } else {
    if (rcon.connected) {
      rcon.send(line)
    } else {
      console.log(`Can't run '${line}', rcon is not connected!`)
    }
  }
})

process.once('exit', (success, code, signal) => {
  console.log(`game quit with code ${code}`)
  Deno.exit()
})

onSignal(Deno.Signal.SIGINT , () => {
  kill()

  setTimeout(() => {
    Deno.exit()
  }, 60000)
})
