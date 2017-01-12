const logger = require('./logger');

module.exports = (err, req, res, next) => {
    const status = err.status || 500;
    const requestId = req.id;
    const stackTrace = err.stack;
    const session = req.session;
    const userId = session ? session.uId : null;

    logger.error({
        userId,
        requestId,
        statusCode: status,
        message: err.message
    }, `Stack trace: ${stackTrace}`);

    const body = {
        status,
        requestId,
        message: err.message || 'Something went wrong...'
    };

    res.status(status).send(body);
};
