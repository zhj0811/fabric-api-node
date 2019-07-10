"use strict";

const Koa = require('koa');
const path = require('path');
const router = require('./router/koa-router');
const bodyParser = require('koa-bodyparser');
// var config = require('./sdk/config').config;
const init = require('./sdk/init');
const log4js = require('koa-log4')
const log = require('./common/log4js');
init(path.join(__dirname, './sdk/client_config.yaml'))
// config.initSDKs(path.join(__dirname, './sdk/client_config.yaml'))

const app = new Koa();

app.use(bodyParser());
// logger
app.use(log4js.koaLogger(log.accessor, {level: 'auto'}));

// app.use(async (ctx, next) => {
//   await next();
//   const rt = ctx.response.get('X-Response-Time');
//   log.logger.info(`${ctx.method} ${ctx.url} - ${rt}`);
// });

// // x-response-time
// app.use(async (ctx, next) => {
//   const start = Date.now();
//   await next();
//   const ms = Date.now() - start;
//   ctx.set('X-Response-Time', `${ms}ms`);
// });

// response
// app.use(async ctx => {
//   ctx.body = 'Hello World';
// });

//使用中间路由件
app.use(router.routes());
// app.use(router.routes()).use(router.allowedMethods());


app.listen(3000,function(){
      console.log('服务器访问地址为http://127.0.0.1:3000');
});
