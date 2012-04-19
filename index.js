var HTTP = require('http');
var Path = require('path');
var QS = require('querystring');
var Fs = require('fs');
var view = require('liteview');
var llog = require('./log');
var log = llog.create({},{});
// global Log Object, injuct
Log = {
  get:function(){
    return llog.create({},{});
  }
};
/***********************
  extends http.response 
************************/

HTTP.ServerResponse.prototype.setCookie = function(name,value,options){
  
};
HTTP.ServerResponse.prototype.redirect = function(path){
  this.status = 302;
  this.setHeader('location','');
  this.end();
};
HTTP.ServerResponse.prototype.render = function(tpl,object){
  this.end(view.render(tpl,object));
};
HTTP.ServerResponse.prototype.json = function(object){
  this.end(JSON.stringify(object));
};
HTTP.ServerResponse.prototype.jsonp = function(vars,object){
  this.end(vars+'('+JSON.stringify(object)+');');
};
/***********************
  extends http.request 
************************/
HTTP.IncomingMessage.prototype.getRouter = function(){
  var query = this.__querypath;
  if(query.action) return query;
  var arr = query.split('/');
  var ctrl = arr[1];
  var action = arr[2];
  this.__querypath = {
    controller: ctrl,
    action : action,
    param : arr.slice(3)
  };
  return this.__querypath;
};
HTTP.IncomingMessage.prototype.getCookie = function(){

};
HTTP.IncomingMessage.prototype.getPost = function(cb,noparse){
  var len = this.headers['content-length'];
  var post_buf,offset;
  if(len === undefined){
    var tmp;
    //log.error('req.getPost()  do not support post in chunk!');
    this.on('data',function(chunk){
      if(post_buf){
        len = post_buf.length + chunk.length;
        tmp = new Buffer(len);
        post_buf.copy(tmp,0,0,post_buf.length);
        chunk.copy(tmp,post_buf.length,0,chunk.length);
        post_buf = tmp;
      }else{
        post_buf = chunk;
      }
    });
  }else{
    post_buf = new Buffer(parseInt(len));
    offset = 0;
    this.on('data',function(chunk){
      chunk.copy(post_buf,offset,0,chunk.length);
      offset += chunk.length;
    });
  }
  var self = this;
  this.on('end',function(){
    post_buf = post_buf.toString();
    if(!noparse)post_buf = QS.parse(post_buf);
    if(cb)
      cb(post_buf);
    else
      self.emit('post',post_buf);
  });
};
/** TODO **/
HTTP.IncomingMessage.prototype.getMultiPartPost = function(){

};
/** TODO **/
HTTP.IncomingMessage.prototype.getQuery = function(){
  if(!this.__querystr) return {};
  if(typeof this.__querystr === 'string'){
    this.__querystr = QS.parse(this.__querystr);
  }
  return this.__querystr;
};

/**
  cfg = {
    listen:80 , [needed]
  }
  **/
function Server(cfg){
  this.cfg = this.prepareCfg(cfg);
  this.root = cfg.root;
  this.routermap = null;
  this.serv = null;
  if(cfg.tpl){
    view.init(cfg.tpl);
  }else{
    view.render = function(){return 'view is not inited ! please re-config the server .'};
  }
}
Server.prototype = {
  prepareCfg:function(cfg){
    if( ! /^\//.test(cfg.tpl) ){
      cfg.tpl = Path.join(cfg.root , cfg.tpl);
    }
    if( ! /^\//.test(cfg.errllog) ){
      cfg.errllog = Path.join(cfg.root , cfg.errLog);
    }
    if( ! /^\//.test(cfg.infollog) ){
      cfg.infollog = Path.join(cfg.root , cfg.infoLog);
    }
    return cfg;
  },
  view:function(cfg){
    if(cfg.tpl){
      view.init(cfg.tpl);
    }
    if(cfg.debug){
      view.debug(cfg.debug);
    }
    if(cfg.const){
      view.const(cfg.const);
    }
    return this;
  },
  /** 更换 veiw 引擎 **/
  setView:function(v){
    if(!v.render || v.render.length < 2){
      throw new Error('setView(v), view must implement view.render(tpl,obj)!');
    }
    view = v;
  },
  setLog:function(l,servLog){
    if(!l.get){
      throw new Error('setLog(log,servLog), log must implement Log.get("module")!');
    }
    if(!servLog){
      throw new Error('setLog(log,servLog), servLog need , serverlog will write to this log_group!');
    }
    log = l.get(servLog)
    Log = l;
  },
  /**
    init router info
    router has two type
      path match : start with / , like : /test
      name match : start without /  , like : 404
    **/
  router:function(obj){
    var n = null;
    var matches = {}; // match router
    var named = {}; // named router
    for(var i in obj){
      n = i;
      // router path must start with /
      if(n.indexOf('/') !== 0){
        named[i] = obj[i];
        continue;
        //throw new Error("[config error] router must start with /");
      }
      // remove end / from router path
      if(n.match(/\/$/)) n = n.replace(/\/$/,''); 
      matches[i] = [
        n ? new RegExp('^'+n+'\\b') : /^\/$/,
        obj[i]
      ];
    }
    // add error page default
    if(!named['404']){
      named['404'] = function(req,res,cfg){
        res.status = 404;
        res.end('<h2>404,Page not found!</h2>');
      };
    }
    if(!named['500']){
      named['500'] = function(req,res,cfg){
        res.status = 500;
        res.end('<h2>500,Server error!</h2>');
      }
    }
    this.routermap = {
      matches:matches,
      named:named
    };
    return this;
  },
  /**
   加载控制器控
   **/
  load:function(base){
    var p = Path.join(this.root,base);
    var controllers = Fs.readdirSync(p);
    var res = {};
    var name;
    for(var i = 0 ; i < controllers.length ; i++){
      if(controllers[i].match(/^\./)) continue;
      name = controllers[i].replace(/\.js$/,'');
      res[name] = require(Path.join(p,controllers[i]));
    }
    return res;
  },
  start:function(cb){
    var cfg = this.cfg;
    this.serv = HTTP.createServer(createServerHandler(this.routermap,cfg));
    this.serv.listen(cfg.port,cb);
    return this;
  },
  /** internal handler **/
  static:function(path){
    var p = Path.join(this.root,path);
    return function(req,res){
      //TODO static server
    }
  },
  favicon:function(path){
    var p = Path.join(this.root,path);
    var ico;
    try{
      ico = Fs.readFileSync(p);
    }catch(e){
      
    }
    return function(req,res){
      res.status = 200;
      res.end('');
    }
  }
};

function createServerHandler(router,config){
  config = config ? config : {};
  var matches = router.matches;
  var named = router.named;
  return function(req,res){
    var url = req.url,
      hasQuery,
      flag = false,
      res_header = {'x-power' : 'liteserver(node.js)'};
    // remove query string
    hasQuery = url.indexOf('?'); 
    if( hasQuery !== -1 ){
      req.__querystr = url.substr(hasQuery+1);
      url = url.substr(0,hasQuery);
    }
    try{
      for(var i in matches){
        if(matches[i][0].test(url)){
          req.__querypath = url;
          matches[i][1](req,res,config);
          flag = true;
          break;
        }
      }
      // not found page
      if(!flag){
        named['404'](req,res,config);
      }
    }catch(e){
      i = flag ? i : '404'
      log.error( 'controller error:' + i );
      log.error(e.stack);
    }
  }
}

exports.createServer = function(cfg){
  var server = new Server(cfg);
  return server;
};
exports.Server = Server;
