"use strict";
var express = require('express');
// var handler = require('./handler/handler.js');
var handler = require('./handler/invoke');
// var handler = require('./handler/invoke1.4');
var app = express();

// app.get('/query',handler.query)
app.get('/pay',handler.pay)

var server = app.listen(8888,function(){
  var host = server.address().address;
  var port = server.address().port;
  console.log('应用实例，访问地址为http://%s:%s',host,port);
})
