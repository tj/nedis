
/*!
 * Nedis - Connection
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var net = require('net')
  , commands = require('./commands');

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
            this.state = 'string';
            break;
          case 42: // *
            this.state = 'multi bulk';
            break;
          case 58: // :
            this.state = 'integer';
            break;
          case 36: // $
            this.state = 'bulk';
            break;
          case 45: // -
            this.state = 'error';
            break;
          default:
            this.state = 'unknown';
        }
        break;
      case 'multi bulk':
        // \r
        if (13 == buf[pos]) {
          this.state = 'multi bulk lf';
        // n
        } else {
          this.buf[this.buf.pos++] = buf[pos];
        }
        ++pos;
        break;
      case 'multi bulk lf':
        // \n
        if (10 == buf[pos]) {
          this.multiBulkCount = +toString(this.buf);
          this.buf.pos = 0;
          this.state = 'request';
        // Error  
        } else {
          // TODO:
        }
      case 'bulk':
        // \r
        if (13 == buf[pos]) {
          this.state = 'bulk lf';
        // n
        } else {
          this.buf[this.buf.pos++] = buf[pos];
        }
        ++pos;
      case 'bulk lf':
        // \n
        if (10 == buf[pos++]) {
          this.state = 'bulk lf';
          this.bulkLength = +toString(this.buf);
          console.log(this.buf.toString());
          console.log(this.bulkLength);
        // Error
        } else {
          // TODO:
        }
    }
  }
};

/**
 * Convert `buf` to a string.
 *
 * @param {Buffer} buf
 * @return {String}
 * @api public
 */

function toString(buf) {
  var str = '';
  for (var i = 0, len = buf.pos; i < len; ++i) {
    str += String.fromCharCode(buf[i]);
  }
  return str;
}