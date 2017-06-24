'use strict';
const fs = require('fs');
const debug = require('debug');
const logger = debug('serialport:unixread');
const ReadPoller = require('bindings')('serialport.node').ReadPoller;

module.exports = function readUnix(buffer, offset, length) {
  logger('Starting read');
  return new Promise((resolve, reject) => {
    if (this.readPoller) {
      logger('poller colosing');
      this.readPoller.close();
      this.readPoller = null;
    }

    fs.read(this.fd, buffer, offset, length, null, (err, bytesRead) => {
      if (err && err.code === 'EAGAIN') {
        logger('poller starting');
        this.readPoller = new ReadPoller(this.fd, () => {
          logger('poller finished');
          this.readPoller = null;
          this.read(buffer, offset, length).then(resolve, reject);
        });
        return;
      }

      const disconnectError = err && (
        err.code === 'EBADF' || // Bad file number means we got closed
        err.code === 'ENXIO' || // No such device or address probably usb disconnect
        err.code === 'UNKNOWN' || // ¯\_(ツ)_/¯ does this ever happen?
        err.errno === -1 // generic error
      );

      if (disconnectError) {
        logger('disconnecting');
        return this.disconnect(err);
      }
      if (err) {
        return reject(err);
      }
      logger('Finished read', bytesRead, 'bytes');
      resolve(bytesRead);
    });
  });
};
