
/*!
 * Nedis - utils
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Convert `buf` to a string.
 *
 * @param {Buffer} buf
 * @return {String}
 * @api public
 */

exports.string = function(buf) {
  var str = '';
  for (var i = 0, len = buf.pos; i < len; ++i) {
    str += String.fromCharCode(buf[i]);
  }
  return str;
};

/**
 * Parse a redis `pattern` and return a RegExp.
 *
 * @param {String} pattern
 * @return {RegExp}
 * @api public
 */

exports.parsePattern = function(pattern){
  pattern = pattern
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  return new RegExp('^' + pattern + '$');
};