'use strict';
process.env.DB_HOST = 'localhost';

process.env.HOST = 'http://localhost:9797';
process.env.PORT = 9797;
process.env.DB_USER = 'qualPro';
process.env.DB_PASS = '1q2w3e!@#';
process.env.DB_NAME = 'qualPro';
process.env.DB_PORT = 27017;
process.env.SOCKET_DB_PORT = 6379;
process.env.SOCKET_DB_HOST = 'localhost';
process.env.SOCKET_DB = 9;
process.env.SMS_ACCOUNT_SID = 'AC25bc8f5b66591d28e3d7a179a7904e94';
process.env.SMS_AUTH_TOKEN = 'a5f6a8fb724ec1676407bd61a49208d4';
process.env.SMS_NUMBER = '+12016901984';

// process.env.REDIS_HOST = '192.168.88.250';
process.env.REDIS_HOST = 'localhost';

// process.env.UPLOADER_TYPE = 'AmazonS3';

exports.mongoConfig = {
    db    : {native_parser: true},
    server: {poolSize: 5},
    // replset: { rs_name: 'myReplicaSetName' },
    user  : process.env.DB_USER,
    pass  : process.env.DB_PASS,
    w     : 1,
    j     : true
    // mongos: true
};

exports.sessionConfig = function (db) {
    return {
        mongooseConnection: db,
        autoRemove        : 'interval',
        autoRemoveInterval: 1 // in prod mode should be more, 10
    };
};
