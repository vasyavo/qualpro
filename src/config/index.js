const path = require('path');
const fs = require('fs');
const nconf = require('nconf');
const cluster = require('cluster');

const config = {};

// for example NODE_ENV is development
config.env = process.env.NODE_ENV;
config.isTest = process.env.NODE_ENV === 'test';

config.schedulerHost = process.env.SCHEDULER_HOST || null;

// at this moment environment variables will be imported from .env.development
// if NODE_ENV not provided then dotenv will import variables from .env
require('dotenv').config({
    path: path.join(__dirname, `.env${config.env ? `.${config.env}` : ''}`).normalize(),
});

config.workingDirectory = path.join(__dirname, '../../');

const host = process.env.HOST;

config.port = parseInt(process.env.PORT, 10) || 3000;
config.host = host || 'localhost';
config.localhost = host || `https://${config.host}:${config.port}`;
config.debug = process.env.DEBUG_DEV || false;

/* Database configurations */
config.mongodbUri = process.env.MONGODB_URI;
/* Database configurations */

config.sendgirdApiKey = process.env.SENDGRID_APIKEY;
config.redisUrl = process.env.REDISGREEN_URL || process.env.REDIS_URL;
config.redisSessionDb = process.env.REDIS_SESSION_DB || 7;

/* Twilio configurations */
const twilio = {
    accountSid: process.env.SMS_ACCOUNT_SID,
    authToken: process.env.SMS_AUTH_TOKEN,
    number: process.env.SMS_NUMBER,
};

config.twilio = twilio;
/* Twilio configurations */

/* AWS S3 configurations begin */

// setup default state for run environment
const awsS3Config = {
    bucketName: process.env.AWS_S3_BUCKET,
    region: process.env.AWS_S3_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    imageUrlDurationSec: 60 * 60 * 24 * 365 * 10,
};

config.aws = {
    s3: awsS3Config,
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
    config.aws.s3 = Object.assign({}, awsS3Config, {
        accessKeyId,
        secretAccessKey,
        bucketName: nconf.get('AWS_S3_BUCKET'),
        region: nconf.get('AWS_S3_REGION'),
    });

    process.env.AWS_ACCESS_KEY_ID = accessKeyId;
    process.env.AWS_SECRET_ACCESS_KEY = secretAccessKey;
}

/* end of AWS S3 configurations */

config.uploaderType = 'AmazonS3';

config.isCI = process.env.CI;
config.pullDbOnCI = process.env.PULL_DB_ON_CI || true;

config.fcmApiKey = process.env.FCM_API_KEY;
config.webConcurrency = process.env.WEB_CONCURRENCY || 1;
config.isMaster = cluster.isMaster;

config.pubnub = {
    publishKey: process.env.PUBNUB_PUBLISH_KEY,
    subscribeKey: process.env.PUBNUB_SUBSCRIBE_KEY,
};

config.session = {
    age: process.env.SESSION_AGE || 24 * 60 * 60 * 1000,
    maxAge: process.env.SESSION_MAX_AGE || 365 * 24 * 60 * 60 * 1000,
};

config.importPath = process.env.IMPORT_PATH;

// import this file at begin of server.js
module.exports = config;
