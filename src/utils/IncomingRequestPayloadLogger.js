const logger = require('./logger');

module.exports = function(req, res, next) {
    let message = {
        requestId : req.id,
        method : req.method,
        url : req.originalUrl,
        cookie: req.headers.cookie
    };

    logger.info('Incoming request: ', message);

    next();
};