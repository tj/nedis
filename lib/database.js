
/*!
 * Nedis - Database
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var commands = require('./commands')
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

var mutate = [];

Object.keys(commands).forEach(function(cmd){
  var fn = commands[cmd];
  if (fn.mutates) mutate.push(cmd);
});

/**
 * Initialize a new `Database` with the given `server` and `options`.
 *
 * Options:
 *
 *   `filename`   Append-only file path
 *
 * @param {Server} server
 * @param {Object} options
 */

var Database = module.exports = function Database(server, options) {
  options = options || {};
  this.dbs = [];
  this._types = [];
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
 */

Database.prototype.selectDB = function(index){
  // TODO: these should be their own objects
  // that we can easily swap out in SELECT
  this.data = this.dbs[index] = this.dbs[index] || {};
  this.types = this._types[index] = this._types[index] || {};
};

/**
 * Get / set `key` `type`.
 *
 * @param {String} key
 * @param {String} type
 * @return {String}
 */

Database.prototype.keyType = function(key, type){
  if (type) {
    return this.types[key] = type;
  } else {
    return this.types[key];
  }
};

/**
 * Clear type for `key`.
 *
 * @param {String} key
 */

Database.prototype.clearType = function(key){
  delete this.type[key];
};

/**
 * Create a connection to the server.
 *
 * @return {net.Stream}
 */

Database.prototype.createConnection = function(){
  var addr = this.server.address();
  return net.createConnection(addr.port, addr.host);
};

/**
 * Replay the AOF.
 */

Database.prototype.replayAOF = function(){
  var self = this
    , Connection = require('./connection')
    , client = new Connection(this.server);
  self.server.aof = false;
  var stream = fs.createReadStream(self.filename);
  stream.on('data', function(chunk){ client.parse(chunk); });
  stream.on('end', function(){
    self.server.aof = true;
    self.selectDB(0);
  });
};

/**
 * Write the given `cmd`, and `args` to the AOF.
 *
 * @param {String} cmd
 * @param {Array} args
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
