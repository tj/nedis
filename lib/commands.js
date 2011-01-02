
/*!
 * Nedis - commands
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * GET key.
 */

exports.get = function(stream, key){
  console.log('GET %s', key);
};

/**
 * SET key val
 */

exports.set = function(stream, key, val){
  console.log('SET %s %s', key, val);
};