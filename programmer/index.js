import SerialPort from 'serialport'
import commander from 'commander'
import fs from 'fs'
import ora from 'ora'

const BUFFER_SIZE = 16

function onMessage(connection, test, fn) {
  let allData = ''
  connection.on('data', d => {
    allData += d.toString()
    if(test(allData))
      fn(allData)
  })
}

function onFirstMessage(connection, test, fn) {
  let allData = ''
  function handler(d) {
    allData += d.toString()
    if(test(allData)) {
      connection.removeListener('data', handler)
      fn(allData)
    }
  }
  connection.on('data', handler)
}

async function connectionWrite(connection, char) {
  return new Promise((res, rej) => connection.write('R', err => err ? rej(err) : res()))
}

function read({port, baud}) {
  const spinner = ora('Initiating connection to programmer').start();

  const connection = new SerialPort(port, {
    baudRate: baud,
    dataBits: 8,
    stopBits: 1,
    parity: 'none',
  })

  onFirstMessage(connection, d => d.includes('ACK-READY-ACK'), async () => {
      spinner.text = 'ROM Ready.'
      onMessage(connection, d => d.endsWith('='), allData => {
        const buff = new Buffer(allData, 'base64')
        fs.writeFileSync('/tmp/data.rom', buff)
        spinner.succeed(`${buff.length} bytes written to /tmp/data.rom`)
        connection.close()
      })

      await connectionWrite(connection, 'R')
    })

  let length = 0
  let i = 0
  connection.on('data', async function (data) {
    length += data.length

    if ((i++ % 100) === 0)
      spinner.text = `Read ${length} bytes`
  })
}

function onSingleChars(connection, cb) {
  function capture(res) {
    for (const char of res.toString())
      if(cb(char)) {
        connection.removeListener('data', capture)
        break
      }
  }

  connection.on('data', capture)
}

function write({port, baud}, {file}) {
  const connection = new SerialPort(port, {
    baudRate: baud
  })

  let allData = ''
  let expectedNextChar

  console.log('Reading data from file ', file)
  let data = fs.readFileSync(file)
  data = data.slice(0, 1024*4)
  const encodedData = `${data.toString('base64')}===`

  let index = 0

  console.log('Length encoded:', encodedData.length)

  function sendAllData() {
    onSingleChars(connection, char => {

      if (index === encodedData.length) {
        console.log('All data sent.')
        return true
      }

      if (char === '=') {
        console.log('all data sent.')
        return true
      }

      for(let i = 0; i < BUFFER_SIZE; i++) {
        if (index == encodedData.length)
          break

        connection.write(encodedData[index])
        index++
      }

      if (index % 1000 === 0)
        process.stdout.write('.')

      return false
    })

    connection.write('W')
  }

  connection.on('data', function (data) {
    allData += data.toString()

    process.stdout.write(data.toString())

    if(allData.includes('ACK-READY-ACK')) {
      allData = ''
      sendAllData()
    }

    if(allData.includes('ACK-DONE-ACK')) {
      connection.close()
    }
  })
}

function dispatch(program, action) {
  return (...args) => action(program, ...args)
}

commander
  .requiredOption('-p, --port <port>', 'port (eg: /dev/ttyS4)')
  .option('-b, --baud <baud>', 'baud rate', 115200)

commander
  .command('read')
  .action(dispatch(commander, read))

commander
  .command('write')
  .requiredOption('-f, --file <file>', 'ROM file to be written')
  .action(dispatch(commander, write))

commander.parse(process.argv)

