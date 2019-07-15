Router = require('koa-router');
Handler = require('../handler/hander');
// var fs = require('fs');
router = new Router({
    prefix: "/factor"
  });

router
    // .get('/', Handler.saveData)
    .post('/savedata',Handler.savedata)
    .get('/query',Handler.query)
    // .get('/index', excuteIndex)
    // .post('/post',excutepost)
    // .get('/get', excuteget)
    // .post('/upload', file.uploadFile)
    // .get('/download', file.downloadFile)

exports = module.exports = router;

