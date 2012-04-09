var jsc = require('jscoverage');
require = jsc.require(module);
var Log = require('./log',true);
var fs = require('fs');
var expect = require('expect.js');
describe('test log',function(){
  describe('create log object',function(){
    it('check level',function(done){
      var log = Log.create({
        debug:true,
        trace:true,
        info:true,
        warn:true,
        error:true
      },
      {
        errlog:'err.log',
        infolog:'info.log'
      });
      log.debug('debug');
      log.info('info');
      log.trace('trace');
      log.warn('warn');
      log.error('error');
      setTimeout(function(){
        var err = fs.readFileSync('err.log','utf-8');
        expect(err).to.be.match(/WARN/);
        expect(err).to.be.match(/ERROR/);
        var info = fs.readFileSync('info.log','utf-8');
        expect(info).to.be.match(/INFO/);
        expect(info).to.be.match(/TRACE/);
        expect(info).to.be.match(/DEBUG/);
        fs.unlinkSync('err.log');
        fs.unlinkSync('info.log');
        done();
      },100);
    });

    it('test inner function',function(){
      expect(Log._test('fixZero',[9])).to.be('09');
    });
  });
});
