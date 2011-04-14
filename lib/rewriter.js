
/*!
 * Nedis - Rewriter
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var exec = require('child_process').exec
  , utils = require('./utils')
  , net = require('net')
  , fs = require('fs');

/**
 * Initialize a new AOF Rewriter with the given `db`.
 * 
 * @param {Database}
 */

var Rewriter = module.exports = function Rewriter(db) {
  // TODO: worker
  // TODO: buffered stream fsync
  var self = this;
  this.db = db;
  this.path = '/tmp/nedis-bgrewriteaof-' + (Math.random() * 0xfffffff | 0);
  this.stream = fs.createWriteStream(this.path);
};

/**
 * Initiate rewritting.
 */

Rewriter.prototype.rewrite = function(){
  var keys
    , len
    , db = this.db
    , dblen = db.dbs.length
    , tmpdb = dblen + 1;

  // Select the new DB
  db.selectDB(tmpdb);

  // Iterate DBs, writing the keys
  // out to the new temp AOF
  for (var i = 0; i < dblen; ++i) {
    db = db.dbs[i];
    this.select(i);
    keys = Object.keys(db);
    len = keys.length;
    for (var i = 0; i < len; ++i) {
      this.write(keys[i], db[keys[i]]);
    }
  }

  this.end();
};

/**
 * Close tmpfile stream, and replace AOF
 * will our tempfile, then callback `fn(err)`.
 */

Rewriter.prototype.end = function(fn){
  // TODO: less lame
  var from = this.path
    , to = this.db.filename;
  this.stream.end();
  exec('mv ' + from + ' ' + to, fn);
};

/**
 * Write select.
 */

Rewriter.prototype.select = function(i){
  this.stream.write('*2\r\n$6\r\nSELECT\r\n');
  this.stream.write('$' + i.toString().length + '\r\n');
  this.stream.write(i + '\r\n');
};

/**
 * Write key / val.
 */

Rewriter.prototype.write = function(key, val){
  var type = val.type || 'string';
  return this[type](key, val);
};

/**
 * Write hash.
 */

Rewriter.prototype.hash = function(key, val) {
  // TODO: HMSET
  for (var field in val) {
    if ('type' == field) continue;
    this.stream.write('*4\r\n');
    this.stream.write('$4\r\n');
    this.stream.write('HSET\r\n');
    this.stream.write('$' + key.length + '\r\n');
    this.stream.write(key);
    this.stream.write('\r\n');
    this.stream.write('$' + field.length + '\r\n');
    this.stream.write(field);
    this.stream.write('\r\n');
    this.stream.write('$' + val[field].length + '\r\n');
    this.stream.write(val[field]);
    this.stream.write('\r\n');
  }
};

/**
 * Write string to `stream`.
 */

Rewriter.prototype.string = function(key, val) {
  this.stream.write('*3\r\n');
  this.stream.write('$3\r\n');
  this.stream.write('SET\r\n');
  this.stream.write('$' + key.length + '\r\n');
  this.stream.write(key);
  this.stream.write('\r\n');
  this.stream.write('$' + val.length + '\r\n');
  this.stream.write(val);
  this.stream.write('\r\n');
};