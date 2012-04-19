var LS = require('./index');
var config = {
  port:54321,
  root:__dirname
}
var serv = LS.createServer(config);
serv.router({
  '/a':function(){},
  '/b':function(){},
  '/c':function(){},
  '/d':function(){},
  '/e':function(){},
  '/f':function(){},
  '/g':function(){},
  '/h':function(){},
  '/i':function(){},
  '/j':function(){},
  '/k':function(){},
  '/l':function(){},
  '/m':function(){},
  '/n':function(){},
  '/o':function(){},
  '/p':function(){},
  '/q':function(){},
  '/r':function(){},
  '/s':function(){},
  '/t':function(){},
  '/u':function(){},
  '/v':function(){},
  '/':function(req,res){
    res.end(req.url);
  },
  '/test':function(req,res){
    res.end('test');
  }
});
serv.start();
