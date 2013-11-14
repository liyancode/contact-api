/**
 *   需要的模块依赖
 *   require()方法的参数：
 *       1)如果是非路径字符串（如‘express’），则调用的是node_modules文件夹中的同名模块；
 *       2)如果是指定的路径（如‘./routes’），则调用指定路径的模块，一般是自定义模块。
 *       3)如果是文件名（如‘a.js’），则直接调用文件，一般是自定义的模块
 *   node_modules是项目创建时生成的文件夹，用来放项目的依赖模块，通常是node.js成熟的第三方模块，
 *   例如express、connect-mongo等等，这些依赖模块在package.json文件中定义和添加，在项目根目录下执行
 *      npm install   时自动检查和安装依赖模块，所以如果想使用新的第三方模块，只要在package.json文件中
 *   添加相应的依赖记录，然后在项目根目录执行 npm install ，执行成功后会在node_modules文件夹中
 *   看到模块文件夹，就可以使用了。
 *   require()根据参数找到对应模块文件夹（如果是文件名则直接调用）后，加载过程是这样的：
 *       先找到index.js文件->再找module.exports->返回object，
 *   【可以类比java中的实例化一个object的过程：先找到object(class)所在的包，找到包中的class文件，
 *   然后执行构造函数返回一个object的实例。】
 *   module.exports 是node.js的模块机制的规定，具体可以参见官方的api说明。
 */
var express = require('express');//读取node_modules文件夹下express文件夹下的index.js,下同
var routes = require('./routes');//读取routes文件夹下的index.js
var http = require('http');
var path = require('path');

var MongoStore = require('connect-mongo')(express);//这里的connect-mongo的object是需要参数的，
                                                   // 参数是express object
var settings = require('./settings'); //先是没找到settings文件夹，所以找settings.js文件
var flash = require('connect-flash');

var fs = require('fs');
var accessLog = fs.createWriteStream('access.log', {flags: 'a'});
var errorLog = fs.createWriteStream('error.log', {flags: 'a'});
var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');//定义使用的模板引擎 ejs

app.use(flash());
app.use(express.favicon());//可自定义icon:app.use(express.favicon(__dirname +'/public/images/favicon.ico'));
app.use(express.logger('dev'));//connect 内建的中间件,在开发环境下使用,在终端显示简单的日志.
app.use(express.logger({stream: accessLog}));
app.use(express.bodyParser({ keepExtensions: true, uploadDir: './public/images' }));
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser());

app.use(
    express.session({
        secret: settings.cookieSecret,
        key: settings.db,
        cookie: {
            maxAge: 1000 * 60 * 60 * 24 * 30
        },//30 days
        store: new MongoStore({
            db: settings.db
        })
    })
);
app.use(app.router); //应用解析路由的规则
app.use(express.static(path.join(__dirname, 'public'))); //connect 内建的中间件,设置根目录下的
                                                      // public 文件夹为存放 image、css、js 等静态文件的目录。

app.use(function (err, req, res, next) {
    var meta = '[' + new Date() + '] ' + req.url + '\n';
    errorLog.write(meta + err.stack + '\n');
    next();
});
// development only   开发环境下的错误处理,输出错误信息。
if ('development' == app.get('env')) {
    app.use(express.errorHandler());
}
//这段代码的意思是创建 http 服务器并监听 3000 端口
http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

routes(app);  //路由规则全放在routes模块中
