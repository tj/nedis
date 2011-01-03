
/*!
 * Nedis - Connection
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var net = require('net')
  , utils = require('./utils')
  , commands = require('./commands')
  , toString = utils.toString;

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
  this.debug = true; // TODO: option
  stream.on('data', this.parse.bind(this));
};

/**
 * Reply with the given `data`.
 *
 * @param {Buffer} data
 * @api public
 */

Connection.prototype.send = function(data){
  this.stream.write('$' + data.length + '\r\n');
  this.stream.write(data);
  this.stream.write('\r\n');
};

/**
 * Reply with error `msg`.
 *
 * @param {String} msg
 * @api private
 */

Connection.prototype.error = function(msg){
  this.stream.write('-ERR ' + msg + '\r\n');
};

/**
 * Reply with nil.
 *
 * @api private
 */

Connection.prototype.nil = function(){
  this.stream.write('$-1\r\n');
};

/**
 * Reply with OK.
 *
 * @api private
 */

Connection.prototype.ok = function(){
  this.stream.write('+OK\r\n');
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
    if (this.debug) {
      console.log('  \x1b[33m%s\x1b[0m \x1b[90m->\x1b[0m %j', this.state, String.fromCharCode(buf[pos]));
    }
    switch (this.state) {
      
      /**
       *   '+'
       * | '*'
       * | ':'
       * | '$'
       * | '-'
       */
      
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
      
      /**
       * n* '\r'
       */
        
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
      
      /**
       * '\n'
       */
      
      case 'multi bulk lf':
        // \n
        if (10 == buf[pos++]) {
          this.state = 'request';
          this.multiBulkCount = +toString(this.buf);
          this.buf.pos = 0;
        // Error  
        } else {
          this.error('missing line feed for multi-bulk count');
        }
        break;
      
      /**
       * n* '\r'
       */
      
      case 'bulk':
        // \r
        if (13 == buf[pos]) {
          this.state = 'bulk lf';
        // n
        } else {
          this.buf[this.buf.pos++] = buf[pos];
        }
        ++pos;
        break;
      
      /**
       * '\n'
       */
      
      case 'bulk lf':
        // \n
        if (10 == buf[pos++]) {
          this.bulkLength = +toString(this.buf);
          this.bulkReceived = 0;
          this.buf.pos = 0;
          this.state = 'data';
        // Error
        } else {
          this.error('missing line feed for bulk length');
        }
        break;
      
      /**
       * c {bulkLength} '\r'
       */
      
      case 'data':
        if (this.bulkReceived++ == this.bulkLength) {
          // Argument
          if (this.cmd) {
            // Push argument Buffer
            var len = this.buf.pos
              , arg = new Buffer(len);
            this.buf.copy(arg, 0, 0, len);
            var arglen = this.args.push(arg); 
            
            // Arity match, invoke the command
            if (arglen == this.arity) {
              // TODO: pass the array instead of apply
              this.args.unshift(this);
              this.server.store[this.cmd].apply(this.server.store, this.args);
              this.cmd = null;
            }
          // Command  
          } else {
            var fn;
            this.cmd = toString(this.buf).toLowerCase();
            // Command is valid
            if (fn = commands[this.cmd]) {
              // TODO: compare arity to multiBulkCount?
              this.arity = fn.length - 1;
              this.args = [];
            // Invalid command  
            } else {
              return this.error("unknown command '" + this.cmd + "'");
            }
          }
          // \r
          if (13 == buf[pos++]) {
            this.state = 'data lf';
          // Error
          } else {
            this.error('missing carriage return for bulk data');
          }
        } else {
          this.buf[this.buf.pos++] = buf[pos++];
        }
        break;
      
      /**
       * '\n'
       */
      
      case 'data lf':
        // \n
        if (10 == buf[pos++]) {
          this.state = 'request';
          this.buf.pos = 0;
        // Error
        } else {
          this.error('missing line feed for bulk data');
        }
        break;
    }
  }
};
