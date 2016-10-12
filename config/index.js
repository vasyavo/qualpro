const path = require('path');
const config = {};

// for example NODE_ENV is development
config.env = process.env.NODE_ENV;
config.isTest = process.env.NODE_ENV === 'test';

// at this moment environment variables will be imported from .env.development
// if NODE_ENV not provided then dotenv will import variables from .env
require('dotenv').config({
    path: path.join(__dirname, `.env${config.env ? `.${config.env}` : ''}`).normalize(),
});

// Heroku Compose.io addon variable
const mongohqUrl = process.env.MONGOHQ_URL;
const dbConfig = {
    user : process.env.DB_USER,
    password : process.env.DB_PASS,
    host : process.env.DB_HOST,
    port : process.env.DB_PORT,
    name : process.env.DB_NAME
};

config.dbConfig = dbConfig;
config.mongodbUri = mongohqUrl ? mongohqUrl :
    `mongodb://${dbConfig.host}:${dbConfig.port}/${dbConfig.name}`;

/* following code is copied from vcs and modified */
const mongoConfig = {
    db    : {native_parser: true},
    server: {poolSize: 5},
    // replset: { rs_name: 'myReplicaSetName' },
    user  : process.env.DB_USER,
    pass  : process.env.DB_PASS,
    w     : 1,
    j     : true
    // mongos: true
};

const sessionConfig = (db) => {
    return {
        mongooseConnection: db,
        autoRemove        : 'interval',
        autoRemoveInterval: 1 // in prod mode should be more, 10
    };
};

config.mongoConfig = mongoConfig;
config.sessionConfig = sessionConfig;
/* end of copy */

// import this file at begin of server.js
module.exports = config;
