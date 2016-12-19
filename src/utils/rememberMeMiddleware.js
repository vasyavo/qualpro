const CONSTANTS = require('./../constants/mainConstants');

module.exports = (req, res, next) => {
    const session = req.session;

    if (session && !session.rememberMe) {
        session.cookie.maxAge = CONSTANTS.SESSION_TTL;
    }

    next();
};