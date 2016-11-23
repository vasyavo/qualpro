const logger = require('./logger');

module.exports = (err, req, res, next) => {
    const status = err.status || 500;
    const requestId = req.id;
    const stackTrace = err.stack;

    logger.error(`User id: ${req.session.uId}.`, `Happened in request ${requestId} with status ${status}: `, stackTrace);

    const body = {
        status,
        requestId,
        message: err.message
    };

    res.status(status).send(body);
};