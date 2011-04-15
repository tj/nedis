
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
  if (server) {
    this.dbs = [];
    this.selectDB(0);
    this.server = server;
    this.filename = options.filename || process.cwd() + '/nedis.db';
    this.stream = fs.createWriteStream(this.filename, { flags: 'a' });
    server.on('listening', this.replayAOF.bind(this));
  } else {
    this.data = {};
  }
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
  var db = this.dbs[index] = this.dbs[index] || new Database;
  this.db = db;
};

/**
 * Lookup `key`, when volatile compare timestamps to
 * expire the key.
 *
 * @param {String} key
 * @return {Object}
 */

Database.prototype.lookup = function(key){
  var obj = this.db.data[key];
  if (obj && 'number' == typeof obj.expires && Date.now() > obj.expires) {
    delete this.db.data[key];
    return;
  }
  return obj;
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
