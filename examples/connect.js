
// $ npm install connect connect-redis

/**
 * Module dependencies.
 */

var connect = require('connect')
  , RedisStore = require('connect-redis')
  , nedis = require('../');

// nedis

nedis.createServer().listen();

// connect server

connect(
  connect.cookieParser(),
  connect.session({ store: new RedisStore, secret: 'whatever' }),
  function(req, res){
    req.session.hits = req.session.hits || 0;
    var n = req.session.hits++;
    res.end('viewed ' + n + ' times');
  }
).listen(3000);