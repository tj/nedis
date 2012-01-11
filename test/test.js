
/**
 * Module dependencies.
 */

var nedis = require('../')
  , net = require('net')
  , fs = require('fs');

/**
 * Server.
 */

var server = nedis.createServer().listen(0);

server.on('listening', function(){

  /**
   * Client.
   */

  var client = net.createConnection(server.address().port);

  /**
   * Timeout support.
   */

  client.setEncoding('utf8');
  client.setTimeout(1000);
  client.on('timeout', function(){
    console.error('timed out');
    process.exit(1);
  });

  /**
   * Test cases.
   */

  var files = fs.readdirSync(__dirname + '/cases').filter(function(file){
    return !~file.indexOf('.out');
  }).sort();

  /**
   * Normalize `str`.
   *
   * @return {String}
   */

  function normalize(str) {
    return str
      .replace(/^\-+\n/gm, '')
      .replace(/\n/g, '\r\n');
  }

  /**
   * Expose hidden chars in `str`.
   *
   * @param {String} str
   * @return {String}
   */

  function expose(str) {
    return str
      .replace(/\r\n/g, '\\r\\n\n')
      .replace(/^/gm, '  ');
  }

  /**
   * Run tests.
   */

  client.on('connect', function(){
    (function next(){
      if (!(file = files.shift())) process.exit(0);

      process.stdout.write('\033[90m  ' + file + '\033[0m ');

      // Read test case
      var input
        , expected
        , start
        , path = __dirname + '/cases/' + file;

      // input
      fs.readFile(path, 'utf8', function(err, str){
        input = normalize(str);
        input && expected && test();
      });

      // output
      fs.readFile(path + '.out', 'utf8', function(err, str){
        expected = '+OK\r\n' + normalize(str);
        input && expected && test();
      });

      function test(){
        expected = expected.trimRight().split(/\r\n/);
        client.on('data', compare);
        start = new Date;
        client.write('*1\r\n$7\r\nFLUSHDB\r\n');
        client.write(input);
      }

      function compare(reply){
        reply.trimRight().split(/\r\n/).forEach(function(line){
          if (line == expected[0]) {
            expected.shift();
          } else {
            console.error('\n\n  \033[31m%s:\033[0m ', 'expected');
            console.error(expose(expected[0]));
            console.error('  \033[31m%s:\033[0m ', 'got');
            console.error(expose(line));
            console.error();
            process.exit(1);
          }
        })

        if (!expected.length) {
          console.error('\033[32m%dms\033[0m', new Date - start);
          client.removeListener('data', compare);
          next();
        }
      }

    })();
  });
});
