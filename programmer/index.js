import commander from 'commander'
import fs from 'fs'
import ora from 'ora'
import cliProgress from 'cli-progress'
import cliDefaultFormatter from 'cli-progress/lib/formatter.js'
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
  spinner.text = `Verifying ROM image against file ${file}`
  spinner.stop()

  const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  bar1.start(BLOCK_LENGTH, 0);

  ready.then(() => {
    captureData(connection).then(allData => {
      bar1.stop()

      const data = fs.readFileSync(file).slice(0, BLOCK_LENGTH)

      if (Buffer.compare(allData, data) === 0)
        spinner.succeed("Verification confirm.")
      else
        spinner.fail("Verification failed.")
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

function write(options, {file, verify: verifyAfterWrite}) {
  const spinner1 = ora(`Reading file ${file}`).start();
  const data = fs.readFileSync(file)
  const encodedData = data.slice(0, BLOCK_LENGTH)
  spinner1.succeed(`File ${file} loaded OK.  Encoded size: ${encodedData.length}`)
  spinner1.stop()

  const {spinner, connection, ready} = startConnection(options)

  function formatter(options, params, payload) {
    options.format = `${payload.serialStatus || ' '} progress [{bar}] {percentage}% | {value}/{total}`
    return cliDefaultFormatter(options, params, payload)
  }

  function sendAllData(bar1) {
    let index = 0
    let message = ''
    onSingleChars(connection, char => {
      if (index === encodedData.length)
        return true

      for(let i = 0; i < BUFFER_SIZE; i++) {
        if (index == encodedData.length)
          break

        bar1.update(index, {serialStatus: char})
        connection.write(encodedData.subarray(index, index + 1))
        index++
      }

      return false
    })

    connection.write('W')
  }

  ready.then(() => {
    spinner.succeed()//'Rom Ready')
    const bar1 = new cliProgress.SingleBar({format: formatter}, cliProgress.Presets.shades_classic);
    bar1.start(encodedData.length, 0);

    onFirstMessage(connection, d => d.includes('ACK-DONE-ACK'), () => {

      bar1.update(encodedData.length)
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
  return (...args) => action(program, ...args)
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
  .option('-b, --baud <baud>', 'baud rate', 115200)

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

