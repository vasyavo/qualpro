const logger = require('./logger');

module.exports = function(req, res, next) {
    let message = {
        requestId : req.id,
        method : req.method,
        url : req.originalUrl
    };

    logger.info('Incoming request: ', message);

    next();
};