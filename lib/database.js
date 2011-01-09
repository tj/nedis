
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
 * Initialize a new `Database` with the given `options`.
 *
 * Options:
 *
 *   `filename`   Append-only file path
 *
 * @param {Object} options
 * @api private
 */

var Database = module.exports = function Database(options) {
  this.data = {};
  options = options || {};
  this.filename = options.filename || process.cwd() + '/nedis.db';
  this.stream = fs.createWriteStream(this.filename, { flags: 'a' });
};

/**
 * Expose commands to store.
 */

Database.prototype = commands;

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
    this.stream.write(args[i]);
    this.stream.write('\r\n');
  }
};
