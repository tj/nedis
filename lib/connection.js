
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
  this.server = server;
  this.stream = stream;
  this.state = 'request';
  this.buf = new Buffer(128);
  this.buf.pos = 0;
  stream.on('data', this.parse.bind(this));
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
      case 'multi bulk count':
        // \r
        if (13 == buf[pos]) {
          this.state = 'multi bulk count lf';
        // n
        } else {
          this.buf[this.buf.pos++] = buf[pos];
        }
        ++pos;
        break;
      case 'multi bulk count lf':
        // \n
        if (10 == buf[pos++]) {
        console.log(this.buf.slice(0, this.buf.pos).toString());
        // Error  
        } else {
          
        }
    }
  }
};
