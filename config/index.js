const path = require('path');
const fs = require('fs');
const nconf = require('nconf');
const config = {};

// for example NODE_ENV is development
config.env = process.env.NODE_ENV;
config.isTest = process.env.NODE_ENV === 'test';

// at this moment environment variables will be imported from .env.development
// if NODE_ENV not provided then dotenv will import variables from .env
require('dotenv').config({
    path: path.join(__dirname, `.env${config.env ? `.${config.env}` : ''}`).normalize(),
});

config.port = parseInt(process.env.PORT) || 443;
config.nodeAppInstance = parseInt(process.env.NODE_APP_INSTANCE, 10) || 0;
config.nodePort = config.port + config.nodeAppInstance;

// Heroku Compose.io addon variable
const mongohqUrl = process.env.MONGOHQ_URL || process.env.MONGODB_URI;

/* Database configurations */
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
/* Database configurations */

config.redisUrl = process.env.REDIS_URL;

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

/* AWS S3 configurations begin */

// setup default state for run environment
config.aws = {
    s3: {
        bucket: process.env.AWS_S3_BUCKET,
        region: process.env.AWS_S3_REGION,
    },
};

// path to file with credentials
config.awsCredentialsPath = path.join(__dirname, 'aws.json').normalize();

// load credentials from file if it exist for development purposes
if (fs.existsSync(config.awsCredentialsPath)) {
    nconf.argv().env().file({
        file: config.awsCredentialsPath,
    });

    const accessKeyId = nconf.get('AWS_ACCESS_KEY_ID');
    const secretAccessKey = nconf.get('AWS_SECRET_ACCESS_KEY');

    // rewrite default state with additional props
    config.aws.s3 = {
        accessKeyId,
        secretAccessKey,
        bucketName : nconf.get('AWS_S3_BUCKET'),
        region : nconf.get('AWS_S3_REGION'),
        imageUrlDurationSec : 60 * 60 * 24 * 365 * 10
    };

    process.env.AWS_ACCESS_KEY_ID = accessKeyId;
    process.env.AWS_SECRET_ACCESS_KEY = secretAccessKey;
}
/* end of AWS S3 configurations */

// import this file at begin of server.js
module.exports = config;
