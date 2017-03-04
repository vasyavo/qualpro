const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const mongo = require('./mongo');

const store = new MongoStore({
    autoRemove: 'interval',
    autoRemoveInterval: 10,
    db: mongo.db,
});

module.exports = store;
