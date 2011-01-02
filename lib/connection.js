
/*!
 * Nedis - Connection
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var net = require('net');

/**
 * Initialize a new `Connection` with the given `server` and `stream`.
 * 
 * @param {Server} server
 * @param {Stream} stream
 * @api private
 */

var Connection = module.exports = function Connection(server, stream) {
  var self = this;
  this.server = server;
  this.stream = stream;
  this.state = 'request';
  stream.on('data', function(chunk){
    self.parse(chunk);
  });
};

/**
 * Parse the given Buffer.
 *
 * @param {Buffer} buf
 * @api private
 */

Connection.prototype.parse = function(buf){
  var pos = 0;
  while (pos < buf.length) {
    switch (this.state) {
      case 'request':
        switch (buf[pos++]) {
          case 43: // +
            this.state = 'single line';
            break;
          case 42: // *
            this.state = 'multi bulk count';
            break;
          case 58: // :
            this.state = 'integer line';
            break;
          case 36: // $
            this.state = 'bulk length';
            break;
          case 45: // -
            this.state = 'error line';
            break;
          default:
            this.state = 'unknown';
        }
        break;
    }
  }
};
