import SerialPort from 'serialport'
import commander from 'commander'


function read({port, baud}) {
  const connection = new SerialPort(port, {
    baudRate: baud,
    dataBits: 8,
    stopBits: 1,
    parity: 'none',
  })

  let allData = ''

  connection.on('data', function (data) {
    process.stdout.write('.')

    allData += data.toString()

    if(allData.endsWith('=')) {
      const buff = new Buffer(allData, 'base64')
      let text = buff.toString('ascii')
      console.log(`\n---\n${text}\n--`)
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

function write({port, baud}) {
  const connection = new SerialPort(port, {
    baudRate: baud
  })

  let allData = ''

  connection.on('data', function (data) {
    process.stdout.write(data.toString())

    allData += data.toString()

    if(allData.includes('ACK-READY-ACK')) {
      allData = ''
      connection.write('W')

      connection.write('VGhpcyBpcyBhIHRlc3Q=')
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


//main(commander)
