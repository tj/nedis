
/*!
 * Nedis - commands - server
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var utils = require('../utils');

/**
 * FLUSHDB
 */

exports.flushdb = function(client){
  this.data = {};
  client.ok();
};

/**
 * INFO
 */

exports.info = function(client){
  var buf = '';
  // uptime_in_seconds:29
  // uptime_in_days:0
  // connected_clients:1
  buf += 'connected_clients:' + this.server.clients.length + '\r\n';

  // role:<name>
  buf += 'role:master\r\n';

  // db<index>:keys=<n>,expires=<n>
  this.dbs.forEach(function(db, i){
    var keys = Object.keys(db)
      , len = keys.length;
    if (len) {
      buf += 'db' + i + ':keys=' + len + ',expires=0\r\n';
    }
  });

  client.send(buf);
};