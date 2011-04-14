
/*!
 * Nedis - commands - server
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var Rewriter = require('../rewriter')
  , utils = require('../utils')
  , nedis = require('../nedis');

/**
 * FLUSHDB
 */

(exports.flushdb = function(client){
  this.db.data = {};
  client.ok();
}).mutates = true;

/**
 * FLUSHALL
 */

(exports.flushall = function(client){
  this.dbs = [];
  this.selectDB(0);
  client.ok();
}).mutates = true;

/**
 * DBSIZE
 */

exports.dbsize = function(client){
  client.int(Object.keys(this.db.data).length);
};

/**
 * INFO
 */

exports.info = function(client){
  var buf = ''
    , day = 86400000
    , uptime = new Date - this.server.start;

  buf += 'redis_version:0.0.1\r\n';
  buf += 'nedis_version:' + nedis.version + '\r\n';
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
  new Rewriter(this).rewrite();
  client.write('Background append only file rewriting started');
};
