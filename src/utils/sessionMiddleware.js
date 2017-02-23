const session = require('express-session');
const config = require('./../config');
const sessionStore = require('./sessionStore');

module.exports = session({
    name: 'qualPro_main',
    key: 'qualPro_main',
    secret: 'gE7FkGtEdF32d4f6h8j0jge4547hTThGFyJHPkJkjkGH7JUUIkj0HKh',
    cookie: {
        maxAge: config.session.age,
        httpOnly: true,
        secure: false,
    },
    resave: true,
    rolling: true,
    saveUninitialized: true,
    store: sessionStore,
});
