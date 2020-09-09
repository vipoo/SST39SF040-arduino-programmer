import commander from 'commander'
import fs from 'fs'
import ora from 'ora'
import cliProgress from 'cli-progress'
import {BLOCK_LENGTH, BUFFER_SIZE} from './constants.js'
import {startConnection, onMessage, captureData, onFirstMessage, connectionWrite, onSingleChars} from './communications.js'


function read(options, {file}) {
  const {spinner, connection, ready} = startConnection(options)
  spinner.stop()

  const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  bar1.start(BLOCK_LENGTH, 0);

  ready.then(async () => {
    captureData(connection).then(allData => {
      bar1.stop()

      fs.writeFileSync(file, allData)
      spinner.succeed(`${allData.length} bytes written to ${file}`)
      connection.close()
    })

    connectionWrite(connection, 'R')
  })

  let length = 0
  connection.on('data', data => {
    length += data.length
    if(data.length > BLOCK_LENGTH)
      data.length = BLOCK_LENGTH

    bar1.update(length)
  })
}

function erase(options) {
  const {spinner, connection, ready} = startConnection(options)

  ready.then(() => {
    onMessage(connection, d => d.includes('ACK-ERASE-DONE-ACK'), async () => {
      spinner.succeed("Chip Erased.")
      connection.close()
    })
    connectionWrite(connection, 'E')
  })
}

function verify(options, {file}) {
  const {spinner, connection, ready} = startConnection(options)
  spinner.succeed(`Verifying ROM image against file ${file}`)
  spinner.stop()

  const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  bar1.start(BLOCK_LENGTH, 0);

  ready.then(() => {
    captureData(connection).then(allData => {
      bar1.stop()

      const data = fs.readFileSync(file).slice(0, BLOCK_LENGTH)

      if (Buffer.compare(allData, data) === 0)
        spinner.succeed("Verification confirm.")
      else {
        spinner.fail("Verification failed.")
        console.log(allData.length, data.length)
        let c = 0;
        for( let i =0; i < BLOCK_LENGTH; i++) {
          if( allData[i] != data[i]) {
            console.log(`Different at byte ${i}.  ${allData[i]}, ${data[i]}`)
            c++;
            if (c > 20)
              break;
          }
        }
      }
      connection.close()
    })

    connectionWrite(connection, 'R')
  })

  let length = 0
  connection.on('data', data => {
    length += data.length
    if(length > BLOCK_LENGTH)
      length = BLOCK_LENGTH

    bar1.update(length)
  })
}

function write(options, {file, verify: verifyAfterWrite}) {
  const data = fs.readFileSync(file)

  const {spinner, connection, ready} = startConnection(options)
  if( data.length !== BLOCK_LENGTH) {
    spinner.fail("Incorrect file size.  Required file size of ${BLOCK_LENGTH}")
    return false;
  }
  spinner.succeed(`File ${file} loaded OK.  Size: ${data.length}`)
  spinner.stop()

  const bar1 = new cliProgress.SingleBar({etaBuffer: 20}, cliProgress.Presets.shades_classic);
  bar1.start(BLOCK_LENGTH, 0);

  let intervalHandle

  function sendAllData(bar1) {
    let index = 0
    let message = ''
    intervalHandle = setInterval(() => {
      if (index < data.length)
        bar1.update(index)
    }, 50)

    onSingleChars(connection, char => {
      if (index === data.length)
        return true

      for(let i = 0; i < BUFFER_SIZE; i++) {
        if (index == data.length)
          break

        connection.write(data.subarray(index, index + 1))
        index++
      }

      return false
    })

    connection.write('W')
  }

  ready.then(async () => {
    onFirstMessage(connection, d => d.includes('ACK-DONE-ACK'), () => {
      clearInterval(intervalHandle);
      bar1.update(data.length)
      bar1.stop()
      spinner.succeed('Data write completed.')
      connection.close()
      connection.destroy()

      if(verifyAfterWrite)
        setTimeout(() => verify(options, {file}), 500)
    })

    sendAllData(bar1)
  })
}

function dispatch(program, action) {
  return (args) => {
    if (args.file.startsWith('"'))
      args.file = args.file.slice(1, -1)
    action(program, args)
  }
}

const errorHandler = err => {
  console.log("\n")
  const spinner = ora(err.message).start()
  spinner.fail(err.message)
  spinner.stop()
  console.error(err.stack)

  setTimeout(() => process.exit(1), 0)
}

process.on('uncaughtException', errorHandler)
process.on('unhandledRejection', errorHandler)

commander
  .requiredOption('-p, --port <port>', 'port (eg: /dev/ttyS4)')
  .option('-b, --baud <baud>', 'baud rate', 250000)

commander
  .command('read')
  .requiredOption('-f, --file <file>', 'file to store ROM image')
  .action(dispatch(commander, read))

commander
  .command('write')
  .requiredOption('-f, --file <file>', 'ROM file to be written')
  .option('-v, --verify', 'read data and verify if write succeeded')
  .action(dispatch(commander, write))

commander
  .command('verify')
  .requiredOption('-f, --file <file>', 'ROM file to be written')
  .action(dispatch(commander, verify))

commander
  .command('erase')
  .action(dispatch(commander, erase))

commander.parse(process.argv)

