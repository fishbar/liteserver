var HTTP = require('http');
var Path = require('path');
var QS = require('querystring');
var Fs = require('fs');
var view = require('liteview');
var Log = require('./log');
// global Log
log = Log.create({info:true},{});

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
  var ctrl = arr[0];
  var action = arr[1];
  arr.shift();
  arr.shift();
  this.__querypath = {
    controller: ctrl,
    action : action,
    param : arr
  };
  return this.__querypath;
};
HTTP.IncomingMessage.prototype.getCookie = function(){

};
HTTP.IncomingMessage.prototype.getPost = function(cb){
  var len = this.headers['content-length'];
  if(len === undefined){
    log.error('req.getPost()  do not support post in chunk!');
    return;
  }
  var post_buf = new Buffer(parseInt(len));
  var offset = 0;
  this.on('data',function(chunk){
    chunk.copy(post_buf,offset,0,chunk.length);
    offset += chunk.length;
  });
  var self = this;
  this.on('end',function(){
    post_buf = post_buf.toString();
    post_buf = QS.parse(post_buf);
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
  this.cfg = cfg;
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
  serView:function(v){
    if(!v.render || v.render.length < 2){
      throw new Error('setView(v), view must implement view.render(tpl,obj)!');
    }
    view = v;
  },
  /**
    init router info
    **/
  router:function(obj){
    var n = null;
    for(var i in obj){
      n = i;
      // router path must start with /
      if(n.indexOf('/') !== 0){
        throw new Error("[config error] router must start with /");
      }
      // remove end / from router path
      if(n.match(/\/$/)) n = n.replace(/\/$/,''); 
      obj[i] = [
        new RegExp('^'+n+'\\b'),
        obj[i]
      ];
    }
    this.routermap = obj;
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
    var ico
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
  return function(req,res){
    var url = req.url,
      hasQuery,
      res_header = {'x-power' : 'liteserver(node.js)'};
    // remove query string
    hasQuery = url.indexOf('?'); 
    if( hasQuery !== -1 ){
      req.__querystr = url.substr(hasQuery+1);
      url = url.substr(0,hasQuery);
    }
    for(var i in router){
      if(router[i][0].test(url)){
        req.__querypath = url;
        router[i][1](req,res,config);
        break;
      }
    }
  }
}

exports.createServer = function(cfg){
  log = Log.create(cfg.loglevel ? cfg.loglevel : {},cfg);
  return new Server(cfg);
};
exports.Server = Server;
