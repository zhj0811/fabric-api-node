const path = require('path');
const log4js = require('koa-log4');

log4js.configure(path.join(__dirname, "log4js.json"));




// function deflogger(){
//     log4js.koaLogger(log4js.getLogger('default'));
// }

var logger = log4js.getLogger('default');
var errlogger = log4js.getLogger('error');
var accessor = log4js.getLogger('access');
var handlelogger = log4js.getLogger('handler');
var sdklogger = log4js.getLogger("sdk");
var schemalogger = log4js.getLogger("schema");
var utilslogger =  log4js.getLogger("utils");

module.exports = {
    accessor,
    logger,
    // deflogger,
    errlogger,
    handlelogger,
    sdklogger,
    schemalogger,
    utilslogger
};