
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
 * Stubbed stream used for AOF replay.
 */

var stub = {
    write: function(){}
  , on: function(){}
};

/**
 * Initialize a new `Connection` with the given `server` and `stream`.
 * 
 * @param {Server} server
 * @param {Stream} stream
 */

var Connection = module.exports = function Connection(server, stream) {
  this.server = server;
  this.state = 'request';
  this.tmp = new Buffer(128);
  this.tmp.pos = 0;
  this.buf = new Buffer(64 * 1024); // TODO: grow
  this.buf.pos = 0;
  this.stream = stream || stub;
  this.stream.on('data', this.parse.bind(this));
};

/**
 * Write single-line reply `str`.
 *
 * @param {String} str
 */

Connection.prototype.write = function(str){
  this.stream.write('+' + str + '\r\n');
};

/**
 * Reply with multi-bulk length of 0.
 */

Connection.prototype.emptyList = function(){
  this.stream.write('*0\r\n');
};

/**
 * Reply with multi-bulk `arr`.
 *
 * @param {Array} arr
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
 */

Connection.prototype.send = function(data){
  var stream = this.stream
    , data = 'number' == typeof data
      ? data.toString()
      : data;
  stream.write('$' + data.length + '\r\n');
  stream.write(data);
  stream.write('\r\n');
};

/**
 * Reply with protocol error `msg`.
 *
 * @param {String} msg
 */

Connection.prototype.protocolError = function(msg){
  this.error('Protocol error: ' + msg);
};

/**
 * Reply with error `msg`.
 *
 * @param {String} msg
 * @return {Boolean}
 */

Connection.prototype.error = function(msg){
  this.stream.write('-ERR ' + msg + '\r\n');
  this.state = 'request';
  this.tmp.pos = 0;
  this.buf.pos = 0;
  this.multiple = null;
  this.cmd = null;
  return true;
};

/**
 * Reply with value type error.
 */

Connection.prototype.typeError = function(){
  this.error('Operation against a key holding the wrong kind of value');
};

/**
 * Reply with range error.
 */

Connection.prototype.rangeError = function(){
  this.error('value is not an integer or out of range');
};

/**
 * Reply with the given integer `n`.
 *
 * @param {Number} n
 */

Connection.prototype.int = function(n){
  this.stream.write(':' + n + '\r\n');
};

/**
 * Reply with the given boolean `val`.
 *
 * @param {Boolean} val
 */

Connection.prototype.bool = function(val){
  this.stream.write(':' + (val ? '1' : '0') + '\r\n');
};

/**
 * Reply with nil.
 */

Connection.prototype.nil = function(){
  this.stream.write('$-1\r\n');
};

/**
 * Reply with OK.
 */

Connection.prototype.ok = function(){
  this.stream.write('+OK\r\n');
};

/**
 * Invoke `cmd` with `args` and reset state.
 *
 * @param {String} cmd
 * @param {Array} args
 */

Connection.prototype.invoke = function(cmd, args){
  //start: "invoke " + cmd
  var db = this.server.db
    , cmd = this.cmd
    , args = this.args;

  // Write to database
  if (this.server.aof) db.writeToAOF(cmd, args);

  // Variable argument
  if (this.multiple) {
    db[cmd](this, args);
  // Fixed arity
  } else {
    args.unshift(this);
    db[cmd].apply(db, args);
  }

  this.cmd = this.multiple = null;
  this.state = 'request';
  //end: "invoke " + cmd
};

/**
 * Buffer argument.
 */

Connection.prototype.bufferArgument = function(){
  // Push argument Buffer
  var len = this.buf.pos
    , arg = new Buffer(len);
  this.buf.copy(arg, 0, 0, len);
  arg.pos = len;
  this.args.push(arg); 
};

/**
 * Buffer command.
 */

Connection.prototype.bufferCommand = function(){
  var fn;
  this.cmd = string(this.buf).toLowerCase();
  // Command is valid
  if (fn = commands[this.cmd]) {
    var multiple = this.multiple = fn.multiple
      , skip = fn.skip || 0
      , argc = this.multiBulkCount - 1
      , arity = fn.length - 1;

    // Validate # of arguments
    var valid = multiple
      ? 0 == (argc - skip) % multiple
      : argc == arity;

    if (!valid) {
      return this.error("wrong number of arguments for '" + this.cmd + "' command");
    }

    this.args = [];
  // Invalid command  
  } else {
    return this.error("unknown command '" + this.cmd + "'");
  }
};

/**
 * Parse the given Buffer.
 *
 * @param {Buffer} buf
 */

Connection.prototype.parse = function(buf){
  var pos = 0
    , len = buf.length;

  //debug: console.error('\n' + buf.toString());
  while (pos < len) {
    //debug: console.error('  \x1b[33m%s\x1b[0m \x1b[90m->\x1b[0m %j', this.state, String.fromCharCode(buf[pos]));
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
          this.tmp[this.tmp.pos++] = buf[pos];
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
          this.multiBulkCount = +string(this.tmp);
          this.multiBulkReceived = 0;
          if (isNaN(this.multiBulkCount)) {
            return this.protocolError('number expected after *');
          }
          this.tmp.pos = 0;
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
          this.tmp[this.tmp.pos++] = buf[pos];
        }
        ++pos;
        break;
      
      /**
       * '\n'
       */
      
      case 'bulk lf':
        // \n
        if (10 == buf[pos++]) {
          this.bulkLength = +string(this.tmp);
          if (isNaN(this.bulkLength)) {
            return this.protocolError('number expected after $');
          }
          this.bulkReceived = 0;
          this.tmp.pos = 0;
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
        // Bulk complete
        if (this.bulkReceived++ == this.bulkLength) {
          // Buffer command name or argument
          var error = this.cmd
            ? this.bufferArgument()
            : this.bufferCommand();

          // Failed
          if (error) return;

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
         // Multi-bulk complete
          if (++this.multiBulkReceived == this.multiBulkCount) {
            this.invoke(this.cmd, this.args);
          }
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
