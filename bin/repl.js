#!/usr/bin/env node
'use strict';
process.env.DEBUG = process.env.DEBUG || '*';
const SerialPort = require('../');

// outputs the path to an arduino or nothing
function findArduino() {
  return new Promise((resolve, reject) => {
    if (process.argv[2]) {
      return resolve(process.argv[2]);
    }
    SerialPort.list((err, ports) => {
      if (err) { return reject(err) }
      let resolved = false;
      ports.forEach((port) => {
        if (!resolved && /arduino/i.test(port.manufacturer)) {
          resolved = true;
          return resolve(port.comName);
        }
      });
      if (!resolved) {
        reject(new Error('No arduinos found'));
      }
    });
  });
}

const repl = require('repl');
// const { promirepl } = require('promirepl')

findArduino().then((portName) => {
  const port = new SerialPort(portName);
  const spRepl = repl.start({ prompt: '> ' });
  spRepl.context.port = port;
});

// promirepl(graphRepl)
