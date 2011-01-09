
/*!
 * Nedis - Database
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var commands = require('./commands')
  , net = require('net')
  , fs = require('fs');

/**
 * Initialize a new `Database` with the given `server` and `options`.
 *
 * Options:
 *
 *   `filename`   Append-only file path
 *
 * @param {Server} server
 * @param {Object} options
 * @api private
 */

var Database = module.exports = function Database(server, options) {
  var self = this
    , options = options || {};
  this.data = {};
  this.server = server;
  this.filename = options.filename || process.cwd() + '/nedis.db';
  this.stream = fs.createWriteStream(this.filename, { flags: 'a' });
  server.on('listening', function(){
    self.load();
  });
};

/**
 * Expose commands to store.
 */

Database.prototype = commands;

/**
 * Create a connection to the server.
 *
 * @return {net.Stream}
 * @api private
 */

Database.prototype.createConnection = function(){
  var addr = this.server.address();
  return net.createConnection(addr.port, addr.host);
};

/**
 * Replay the AOF.
 *
 * @api private
 */

Database.prototype.load = function(){
  var self = this
    , client = this.createConnection();
  client.on('connect', function(){
    var stream = fs.createReadStream(self.filename);
    stream.on('data', function(chunk){
      client.write(chunk);
    });
  });
};

/**
 * Write the given `cmd`, and `args` to the AOF.
 *
 * @param {String} cmd
 * @param {Array} args
 * @api private
 */

Database.prototype.write = function(cmd, args){
  var argc = args.length
    , buf = 
      '*' + (argc + 1) + '\r\n'
    + '$' + cmd.length + '\r\n'
    + cmd + '\r\n';

  // Write head
  this.stream.write(buf);

  // Args
  for (var i = 0; i < argc; ++i) {
    this.stream.write('$' + args[i].length + '\r\n');
    this.stream.write(args[i]);
    this.stream.write('\r\n');
  }
};
