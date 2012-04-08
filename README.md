## liteserver 

liteserver 是一个轻量级的http服务器

##　使用方法
  
  var LiteServer = require('liteserver');
  var serv = LiteServer.create(cfg);  // cfg 参考config配置一节
  var controller = serv.loadController(path); // 加载控制器
  serv.router({
    '/index' : controller.index,
    '/favicon' : serv.favicon(icopath)
  }).view({
    base:tplpath, // 模板的路径， 模板引擎目前只支持 liteview，后续加入其他模板引擎的接入
    debug:debug, // true or false 
  }).start(function(err){
    if(err){
      console.log(err);
    }else{
      console.log('server start!');
    }
  });

## config 配置
  {
    root: string 服务所在的路径 ，加载控制器、模板等等，都依赖此路径
    port: string 服务端口，目前只支持单个端口的绑定。多端口暂不考虑
    errlog: path 错误日志保存地址，不提供将绑定到process.stderr
    infolog: path 一般日志保存地址，不提供将默认和errlog同文件，如果errlog也是空，则绑定到process.stdout
    loglevel: object {debug:bool,trace:bool,info:bool,warn:bool,error:bool} 日志记录开关，可设定哪些日志输出，总共5个级别
    tpl: path 模板存放地址，相对于root的地址，注意path最前面不为"/"开头
    debug: bool 是否调试状态
  }
