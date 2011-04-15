
// $ npm install connect connect-redis

/**
 * Module dependencies.
 */

var connect = require('connect')
  , RedisStore = require('connect-redis')
  , nedis = require('../');

// nedis

nedis.createServer().listen();

// session options

var options = {
    store: new RedisStore
  , secret: 'whatever'
  , cookie: {
    maxAge: 60000
  }
};

// connect server

connect(
  connect.favicon(),
  connect.cookieParser(),
  connect.session(options),
  function(req, res){
    req.session.hits = req.session.hits || 0;
    var n = req.session.hits++
      , maxAge = req.session.cookie.maxAge;
    res.end('viewed ' + n + ' times, expires in ' + (maxAge / 1000) + ' seconds');
  }
).listen(3000);