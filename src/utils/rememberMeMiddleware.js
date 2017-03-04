const config = require('./../config');

const {
    age,
    maxAge,
} = config.session;

module.exports = (req, res, next) => {
    const session = req.session;

    if (session && session.rememberMe) {
        session.cookie.maxAge = maxAge;
    } else {
        session.cookie.maxAge = age;
    }

    next();
};