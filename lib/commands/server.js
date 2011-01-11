
/*!
 * Nedis - commands - server
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var utils = require('../utils')
  , Rewritter = require('../rewritter');

/**
 * FLUSHDB
 */

(exports.flushdb = function(client){
  this.data = {};
  client.ok();
}).mutates = true;

/**
 * INFO
 */

exports.info = function(client){
  var buf = ''
    , day = 86400000
    , uptime = new Date - this.server.start;

  buf += 'uptime_in_seconds:' + (uptime / 1000).toFixed(0) + '\r\n';
  buf += 'uptime_in_days:' + (uptime / day).toFixed(0) + '\r\n';
  buf += 'connected_clients:' + this.server.clients.length + '\r\n';
  buf += 'role:master\r\n';

  this.dbs.forEach(function(db, i){
    var keys = Object.keys(db)
      , len = keys.length;
    if (len) {
      buf += 'db' + i + ':keys=' + len + ',expires=0\r\n';
    }
  });

  client.send(buf);
};

/**
 * BGREWRITEAOF
 */

exports.bgrewriteaof = function(client){
  // TODO: worker
  var db
    , keys
    , len
    , dblen = this.dbs.length
    , tmpdb = dblen + 1
    , aof = new Rewritter(this);

  // Select the new DB
  this.selectDB(tmpdb);

  // Iterate DBs, writing the keys
  // out to the new temp AOF
  for (var i = 0; i < dblen; ++i) {
    db = this.dbs[i];
    aof.select(i);
    keys = Object.keys(db);
    len = keys.length;
    for (var i = 0; i < len; ++i) {
      aof.write(keys[i], db[keys[i]]);
    }
  }

  aof.end();
  client.write("Background append only file rewriting started");
};
