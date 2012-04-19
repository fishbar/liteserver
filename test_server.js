var jsc = require('jscoverage');
require = jsc.require(module);
var LS = require('./index',true);
var http = require('http');
var expect = require('expect.js');

process.on('exit',jsc.coverage);

// case start 
var config = {
  port:54321,
  root:__dirname
}
var serv = LS.createServer(config);
// load controller
serv.router({
  '/test' : function(req,res,config){
    res.json(req.getRouter());
  },
  '/':function(req,res,config){
    res.json({path:req.url});
  }
}).start(function(){
  log.info('server start');
});

describe('SERVER TEST',function(){
  describe("req functions",function(){
    it('#getRouter',function(done){
      var opt = {
        host: 'localhost',
        port: '54321',
        path : '/test/act/1/2/3'
      };
      http.get(opt,function(res){
        res.getPost(function(data){
          var res = JSON.parse(data.toString());
          expect(res.controller).to.be('test');
          expect(res.action).to.be('act');
          expect(res.param.length).to.be(3);
          done(); 
        },true)
      });
    });
    it('#router dispatch',function(done){
      var opt = {
        host: 'localhost',
        port: '54321',
        path : '/'
      };
      http.get(opt,function(res){
        res.getPost(function(data){
          var res = JSON.parse(data.toString());
          expect(res.path).to.be('/');
          done(); 
        },true);
      });
    });

  });
});
