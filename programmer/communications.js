import SerialPort from 'serialport'
import ora from 'ora'
import {BLOCK_LENGTH} from './constants.js'

export function onMessage(connection, test, fn) {
  let allData = ''
  connection.on('data', d => {
    allData += d.toString()
    if(test(allData))
      fn(allData)
  })
}

export function captureData(connection) {
  return new Promise((res, rej) => {
    let allData = Buffer.alloc(BLOCK_LENGTH)
    let pointer = 0
    connection.on('data', d => {
      d.copy(allData, pointer)
      pointer += d.length
      if(pointer >= BLOCK_LENGTH)
        res(allData)
    })
  })
}

export function onFirstMessage(connection, test, fn) {
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

export async function connectionWrite(connection, char) {
  return new Promise((res, rej) => connection.write(char, err => err ? rej(err) : res()))
}

export function onSingleChars(connection, cb) {
  function capture(res) {
    for (const char of res.toString())
      if(cb(char)) {
        connection.removeListener('data', capture)
        break
      }
  }

  connection.on('data', capture)
}

export function startConnection({port, baud}) {
  const spinner = ora('Initiating connection to programmer').start();

  const connection = new SerialPort(port, {
    baudRate: baud,
    dataBits: 8,
    stopBits: 1,
    parity: 'none',
  })

  const ready = new Promise(res => {
    onFirstMessage(connection, d => d.includes('ACK-READY-ACK'), () => {
      spinner.text = 'ROM Ready.'

      res()
    })
  })

  return {spinner, connection, ready}
}