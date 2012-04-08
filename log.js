var fs = require('fs'),
  util = require('util'),
  types = [
    'DEBUG',
    'TRACE',
    'INFO',
    'WARN',
    'ERROR'
  ],
  colors = [
    36,
    35,
    '',
    33,
    31,
    /*
    debug:36,
    //trace:34,
    trace:35,
    //info:35,
    info:'',
    //warn:31,
    //error:32,
    warn : 33,
    error : 31,
    //ext1:36,
    //ext2:33
    */
  ];

function fixZero(num) {
  return num > 9 ? num : '0' + num;
}

function getTime () {
  var t = new Date();
  return [t.getFullYear(),'-',fixZero(t.getMonth()+1),'-',fixZero(t.getDate()),' ',fixZero(t.getHours()), ':', fixZero(t.getMinutes()), ':', fixZero(t.getSeconds())].join('');
}

var head = '\x1B[', foot = '\x1B[0m';

function formatLog (type,msg,time) {
  var color = colors[type]+'m';
  var msg = util.format.apply(this,msg);
  return ['[',time,'][', head, color, types[type], foot, '] ', msg, "\r\n"].join('');
}

function Log(level, options) {
  var _cfg = {
    debug:false,
    trace:false,
    info:false,
    warn:true,
    error:true
  };
  if(level)
  for(var i in level){
    _cfg[i] = level[i];
  }
  this.mask = [_cfg.debug, _cfg.trace, _cfg.info, _cfg.warn, _cfg.error];

  options = options ? options : {};
  this.errlog = options.errlog;
  this.infolog = options.infolog;
  if (this.errlog) {
    this.streamErr = fs.createWriteStream(this.errlog, {
      flags: 'a',
      encoding: null,
      mode: 0666
    });
    if(this.errlog !== this.infolog)
      this.streamInfo = fs.createWriteStream(this.infolog,{
        flags: 'a',
        encoding: null,
        mode: 0666
      });
    else
      this.streamInfo = this.streamErr;

    var self = this;
    process.on('exit', function(){
      if(self.streamErr)self.streamErr.end();
      if(self.streamInfo)self.streamInfo.end();
    })
  }else{
    this.streamErr = process.stderr;
    this.streamInfo = process.stdout;
  }
}

Log.prototype.log = function (type, msg) {
  if (!this.mask[type]){
    return;
  }
  var log = formatLog(type, msg, getTime());
  if( type > 2 )
    this.streamErr.write(log);
  else
    this.streamInfo.write(log);
}

/**
  @param {object} level log等级设置
  @param {options} log配置信息
**/
exports.create = function(level, options){
  var l = new Log(level, options);
  return {
    debug : function(msg) {
      l.log(0, arguments);
    },
    trace : function(msg) {
      l.log(1, arguments);
    },
    info : function(msg) {
      l.log(2, arguments);
    },
    warn : function(msg) {
      l.log(3, arguments);
    },
    error : function(msg) {
      l.log(4, arguments);
    }
  }
}
/*
exports.test = function(func,obj){
  return eval(func+'.apply(this,'+JSON.stringify(obj)+')');
}
*/
