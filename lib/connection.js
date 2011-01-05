
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
  , string = utils.string;

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
 * Write single-line reply `str`.
 *
 * @param {String} str
 * @api private
 */

Connection.prototype.write = function(str){
  this.stream.write('+' + str + '\r\n');
};

/**
 * Reply with multi-bulk `arr`.
 *
 * @param {Array} arr
 * @api private
 */

Connection.prototype.list = function(arr){
  var len = arr.length
  this.stream.write('*' + len + '\r\n');
  for (var i = 0; i < len; ++i) {
    this.send(arr[i]);
  }
};

/**
 * Reply with the given bulk `data`.
 *
 * @param {Buffer} data
 * @api private
 */

Connection.prototype.send = function(data){
  var stream = this.stream;
  stream.write('$' + data.length + '\r\n');
  stream.write(data);
  stream.write('\r\n');
};

/**
 * Reply with protocol error `msg`.
 *
 * @param {String} msg
 * @api private
 */

Connection.prototype.protocolError = function(msg){
  this.error('Protocol error: ' + msg);
};

/**
 * Reply with error `msg`.
 *
 * @param {String} msg
 * @api private
 */

Connection.prototype.error = function(msg){
  this.stream.write('-ERR ' + msg + '\r\n');
  this.state = 'request';
  this.buf.pos = 0;
  this.cmd = null;
};

/**
 * Reply with value type error.
 *
 * @api private
 */

Connection.prototype.typeError = function(){
  this.error('Operation against a key holding the wrong kind of value');
};

/**
 * Reply with range error.
 *
 * @api private
 */

Connection.prototype.rangeError = function(){
  this.error('value is not an integer or out of range');
};

/**
 * Reply with the given integer `n`.
 *
 * @param {Number} n
 * @api private
 */

Connection.prototype.int = function(n){
  this.stream.write(':' + n + '\r\n');
};

/**
 * Reply with the given boolean `val`.
 *
 * @param {Boolean} val
 * @api private
 */

Connection.prototype.bool = function(val){
  this.stream.write(':' + (val ? '1' : '0') + '\r\n');
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
 * Invoke `cmd` with `args` and reset state.
 *
 * @param {String} cmd
 * @param {Array} args
 * @api private
 */

Connection.prototype.invoke = function(cmd, args){
  // TODO: pass the array instead of apply
  //start: "invoke " + cmd
  var db = this.server.db;
  this.args.unshift(this);
  db[this.cmd].apply(db, this.args);
  this.cmd = null;
  this.state = 'request';
  //end: "invoke " + cmd
};

/**
 * Parse the given Buffer.
 *
 * @param {Buffer} buf
 * @api private
 */

Connection.prototype.parse = function(buf){
  var pos = 0;
  //debug: console.log('\n' + buf.toString());
  while (pos < buf.length) {
    //debug: console.log('  \x1b[33m%s\x1b[0m \x1b[90m->\x1b[0m %j', this.state, String.fromCharCode(buf[pos]));
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
            return this.protocolError('failed to parse request');
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
          this.multiBulkCount = +string(this.buf);
          if (isNaN(this.multiBulkCount)) {
            return this.protocolError('number expected after *');
          }
          this.buf.pos = 0;
        // Error  
        } else {
          return this.error('missing line feed for multi-bulk count');
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
          this.bulkLength = +string(this.buf);
          if (isNaN(this.bulkLength)) {
            return this.protocolError('number expected after $');
          }
          this.bulkReceived = 0;
          this.buf.pos = 0;
          this.state = 'data';
        // Error
        } else {
          return this.error('missing line feed for bulk length');
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
            arg.pos = len;
            var arglen = this.args.push(arg); 
            
            // Arity match, invoke the command
            if (arglen == this.arity) {
              this.invoke(this.cmd, this.args);
            }
          // Command  
          } else {
            var fn;
            this.cmd = string(this.buf).toLowerCase();
            // Command is valid
            if (fn = commands[this.cmd]) {
              this.args = [];
              this.arity = fn.length - 1;
              
              // Invalid # of arguments
              if (this.multiBulkCount - 1 != this.arity) {
                return this.error("wrong number of arguments for '" + this.cmd + "' command");
              }
              
              // No arguments
              if (0 == this.arity) {
                this.invoke(this.cmd, []);
              }
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
            return this.error('missing carriage return for bulk data');
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
          return this.error('missing line feed for bulk data');
        }
        break;
    }
  }
};
