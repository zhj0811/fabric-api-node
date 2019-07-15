Router = require('koa-router');
Handler = require('../handler/hander');
// var fs = require('fs');
router = new Router({
    prefix: "/example"
  });

router
    // .get('/', Handler.saveData)
    .post('/invoke',Handler.invoke)
    .get('/query',Handler.query)
    // .get('/index', excuteIndex)
    // .post('/post',excutepost)
    // .get('/get', excuteget)
    // .post('/upload', file.uploadFile)
    // .get('/download', file.downloadFile)

exports = module.exports = router;

