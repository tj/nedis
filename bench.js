
/**
 * Module dependencies.
 */

var redis = require('redis')
  , spawn = require('child_process').spawn;

/**
 * Arguments.
 */

var args = process.argv.slice(2);

/**
 * Seconds to test.
 */

var seconds = 5
  , ops = 0
  , ms = seconds * 1000;

// run $ redis-server
// or  $ nedis-server

if ('child' == args[0]) {
  var db = redis.createClient();

  (function next(){
    ++ops;
    db.set('foo', 'bar', next);
  })();

} else {
  var child = spawn('node', [__filename, 'child']);
  child.stdout.setEncoding('ascii');
  child.stdout.on('data', console.log);

  setTimeout(function(){
    child.kill('SIGQUIT');
  }, ms);
}

// report

process.on('SIGQUIT', function(){
  console.log('seconds : %d', seconds);
  console.log('operations : %d', ops);
  console.log('ops / second : %d', ops / seconds);
  process.exit();
});