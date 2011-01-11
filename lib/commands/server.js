
/*!
 * Nedis - commands - server
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var utils = require('../utils')
  , fs = require('fs');

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
  // TODO: mktemp ???
  var db
    , key
    , val
    , keys
    , len
    , dblen = this.dbs.length
    , tmpdb = dblen + 1
    , tmpfile = '/tmp/nedis-bgrewriteaof-' + (Math.random() * 0xfffffff | 0)
    , stream = fs.createWriteStream(tmpfile);

  // Select the new DB
  this.selectDB(tmpdb);

  // Iterate DBs, writing the keys
  // out to the new temp AOF
  for (var i = 0; i < dblen; ++i) {
    db = this.dbs[i];
    // SELECT
    stream.write('*2\r\n$7\r\nSELECT\r\n');
    stream.write('$' + i.toString().length + '\r\n');
    stream.write(i + '\r\n');
    keys = Object.keys(db);
    len = keys.length;
    for (var i = 0; i < len; ++i) {
      key = keys[i];
      val = db[key];
      switch (val.type || 'string') {
        case 'hash':
          writeHash(stream, key, val);
          break;
        // SET
        case 'string':
          writeString(stream, key, val);
          break;
      }
    }
  }

  // TODO: better type handling
  // write out data to tempfile
  // switch old AOF with tempfile
  // turf old db
};

function writeHash(stream, key, val) {
  for (var field in val) {
    if ('type' == field) continue;
    stream.write('*3\r\n');
    stream.write('$4\r\n');
    stream.write('HSET\r\n');
    stream.write('$' + field.length + '\r\n');
    stream.write(field);
    stream.write('\r\n');
    stream.write('$' + val[field].length + '\r\n');
    stream.write(val[field]);
    stream.write('\r\n');
  }
}

function writeString(stream, key, val) {
  stream.write('*3\r\n');
  stream.write('$3\r\n');
  stream.write('SET\r\n');
  stream.write('$' + key.length + '\r\n');
  stream.write(key);
  stream.write('\r\n');
  stream.write('$' + val.length + '\r\n');
  stream.write(val);
  stream.write('\r\n');
}