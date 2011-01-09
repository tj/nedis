
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
 * Commands which mutate the database.
 *
 * Nedis needs to know about these for the append-only log,
 * since there is little need to re-play commands that simply
 * fetch data :)
 * 
 * TODO: flushall / flushdb and friends can probably be highly
 * optimized, and wipe out the AOF all together.
 */

var mutate = [
    'set'
  , 'del'
  , 'mset'
  , 'incr'
  , 'incrby'
  , 'decr'
  , 'decrby'
  , 'rename'
  , 'flushdb'
  , 'append'
  , 'setrange'
  , 'select'
];

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
  options = options || {};
  this.dbs = [];
  this.selectDB(0);
  this.server = server;
  this.filename = options.filename || process.cwd() + '/nedis.db';
  this.stream = fs.createWriteStream(this.filename, { flags: 'a' });
  server.on('listening', this.replayAOF.bind(this));
};

/**
 * Expose commands to store.
 */

Database.prototype = commands;

/**
 * Select database at the given `index`.
 *
 * @param {Number} index
 * @api public
 */

Database.prototype.selectDB = function(index){
  this.data = this.dbs[index] = this.dbs[index] || {};
};

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

Database.prototype.replayAOF = function(){
  var self = this
    , client = this.createConnection();
  client.on('connect', function(){
    self.server.aof = false;
    var stream = fs.createReadStream(self.filename);
    stream.on('data', function(chunk){ client.write(chunk); });
    stream.on('end', function(){
      self.server.aof = true;
      self.selectDB(0);
      client.end();
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

Database.prototype.writeToAOF = function(cmd, args){
  if (!~mutate.indexOf(cmd)) return;

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
