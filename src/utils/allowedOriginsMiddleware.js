const url = require('url');
const config = require('../config');

module.exports = (req, res, next) => {
    const parsedUrl = url.parse(config.schedulerHost);
    const requestHost = req.get('Referrer');

    console.log(requestHost);

    console.log(req.headers, '|', parsedUrl);

    if (parsedUrl.hostname === requestHost) {
        return next();
    }

    const error = new Error('Not found');
    error.status = 404;

    next(error);
};
