const config = require('../config');

module.exports = (req, res, next) => {
    const requestHost = req.headers.host;

    if (config.schedulerHost === requestHost) {
        return next();
    }

    const error = new Error('Not found');
    error.status = 404;

    next(error);
};
