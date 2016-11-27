const logger = require('./logger');

module.exports = (err, req, res, next) => {
    const status = err.status || 500;
    const requestId = req.id;
    const stackTrace = err.stack;
    const userId = req.session.uId || null;

    logger.error({
        userId,
        requestId,
        statusCode: status,
        message: err.message
    }, `Stack trace: ${stackTrace}`);

    const body = {
        status,
        requestId,
        message: 'Something went wrong...'
    };

    res.status(status).send(body);
};
