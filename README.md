## liteserver 

    liteserver 是一个轻量级的http服务器。
    和别的服务器不同的是，这个服务器很懒惰，除了router的解析之外，每个请求会原封不动的交给controller处理
    controller需要cookie、get、post等等的时候，才解析。
    
    liteserver集成了常用的http输入接口（get，post，cookie）和输出接口(模板引擎、json输入，jsonp输出)
    程序则关心控制的编写即可
    
    liteserver可方便的结合cluster使用，以创建多进程服务

## 使用方法

#### 安装模块
  
    npm install liteserver

#### 编写控制器
    
    function index(req,res,config){ // 每个控制器，接收三个
      var router = req.getRouter();
      console.log(router);
    }
    exports = module.exports = index;

#### 编写服务index.js 

    var LiteServer = require('liteserver');
    var serv = LiteServer.create(cfg);  // cfg 参考config配置一节
    var controller = serv.loadController(path); // 从path路径加载控制器，path下所有的js文件，以及目录
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

## 路由规则

    http://domain/controller/action/param[0]/param[1]/param[...]
    上面可以看出，所有的请求路径都被映射成controller、action、param三部分，通过req.getRouter()获得这个router对象
    所以每个功能，都应该被映射成和上面类似的地址
    某些情况，用户请求地址到controller，则会有默认的action响应，这由controller来控制
    action往下的路由是自由的，controller自行控制
    
    var router = req.getRouter()
    
    
    
## req对象的扩展

    var router = req.getRouter()  // 获取路由信息
    var get = req.getQuery()      // 获取get参数，注意数据值没有decodeURIComponent()过，按需处理
    var cookie = req.getCookie()  // 获取cookie，注意数据值没有decodeURIComponent()过，按需处理
    
    req.getPost(function(post){   // 获取简单post的数据，回调函数的形式
      console.log(post);
    });
    
    req.on('post',function(post){     // 获取简单post的数据，事件形式
      console.log(post);
    });
    req.getPost();
    
    /** 通过multipart/form-data提交的数据，通常为上传文件等等,用法和普通的post相同，方法名如下 **/
    req.getMultiPartPost(function(post){});
    
## res对象的扩展

    res.render(tpl,obj)     // 渲染模板，tpl为模板文件相对地址（相对模板的目录），obj为模板中的变量，注意这里直接res.end()了
    res.setCookie(name,value,option) // 设置cookie,  option为对象{expires,path,domain,httponly}
    res.redirect(path)      // path == string 为 302 ， path为router对象，则直接在服务器端跳转至相应的controller.action
    res.json(obj)           // json输出，注意这里直接 res.end()了，不能再继续http输出
    res.jsonp(cb,obj)       // jsonp格式输出，注意这里直接res.end()了，不能再有http输出
    
