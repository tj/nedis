
/**
 * Module dependencies.
 */

var nedis = require('nedis')
  , should = require('should');

module.exports = {
  'test .version': function(assert){
    nedis.version.should.match(/^\d+\.\d+\.\d+$/);
  }
};