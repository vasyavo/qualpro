const logger = require('./logger');

module.exports = (err, req, res, next) => {
    const {
        status = 500,
        stack: stackTrace = '',
        message = 'unhandled_error',
        description = { en: '', ar: ''}
    } = err;
    const {
        id: requestId,
        session: {uId : userId} = {uId: null}
    } = req;

    logger.error({
        userId,
        requestId,
        statusCode: status,
        message
    }, `Stack trace: ${stackTrace}`);

    const body = {
        status,
        requestId,
        message,
        description
    };

    res.status(status).send(body);
};
