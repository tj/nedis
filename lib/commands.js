
/*!
 * Nedis - commands
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * GET key.
 */

exports.get = function(key, fn){
  console.log('GET %s', key);
};

/**
 * SET key val
 */

exports.set = function(key, val, fn){
  console.log('SET %s %s', key, val);
};