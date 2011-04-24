
/**
 * Module dependencies.
 */

var redis = require('redis')
  , spawn = require('child_process').spawn
  , fs = require('fs');

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
  var db = redis.createClient()
    , fn;

  switch (args[1] || 'set') {
    case 'set':
      fn = function(){
        ++ops;
        db.set('foo', 'bar', fn);
      };
      break;
    case 'set-n':
      fn = function(){
        ++ops;
        db.set('foo:' + ops, 'bar', fn);
      };
      break;
    case 'set-large':
      var buf = fs.readFileSync(__filename);
      fn = function(){
        ++ops;
        db.set('file', buf, fn);
      };
      break;
    case 'set-large-n':
      var buf = fs.readFileSync(__filename);
      fn = function(){
        ++ops;
        db.set('file:' + ops, buf, fn);
      };
      break;
    case 'get':
      db.set('foo', 'bar');
      fn = function(){
        ++ops;
        db.get('foo', fn);
      };
      break;
    case 'get-large':
      db.set('file', fs.readFileSync(__filename));
      fn = function(){
        ++ops;
        db.get('file', fn);
      };
      break;
  }

  fn();
} else {
  var child = spawn('node', [__filename, 'child'].concat(args));
  child.stdout.setEncoding('ascii');
  child.stdout.on('data', console.log);

  setTimeout(function(){
    child.kill('SIGQUIT');
  }, ms);
}

// report

process.on('SIGQUIT', function(){
  console.log();
  console.log('  seconds : %d', seconds);
  console.log('  operations : %d', ops);
  console.log('  ops / second : %d', ops / seconds);
  console.log();
  process.exit();
});