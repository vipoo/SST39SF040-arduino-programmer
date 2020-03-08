import SerialPort from 'serialport'
import commander from 'commander'
import fs from 'fs'

const BUFFER_SIZE = 16

function read({port, baud}) {
  const connection = new SerialPort(port, {
    baudRate: baud,
    dataBits: 8,
    stopBits: 1,
    parity: 'none',
  })

  let allData = ''

  let i = 0

  connection.on('data', function (data) {
    if (i++ > 100) {
      i = 0
      console.log(allData.length)
    }

    allData += data.toString()

    if(allData.endsWith('=')) {
      const buff = new Buffer(allData, 'base64')
      fs.writeFileSync('./data.rom', buff)
      console.log('data written to data.rom', buff.length)
      connection.close()
    }

    if(allData.includes('ACK-READY-ACK')) {
      allData = ''
      connection.write('R', err => {
        if (err)
          return console.log('Error on write: ', err.message)
      })
    }
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

