'use strict'

var mongoose = require('mongoose');
var fs = require('fs');
var db;
var app;
var env = process.env;
var connectOptions;
var http = require('http');
var httpServer;
var configs;
var io;
var Events = require('events');
var event = new Events.EventEmitter();

var Scheduler;

/*
 var httpsOptions = {
 key               : fs.readFileSync('./config/ssl/server.key'),
 cert              : fs.readFileSync('./config/ssl/server.crt'),
 ca                : fs.readFileSync('./config/ssl/ca.crt'),
 passphrase        : '2158',
 requestCert       : true,
 rejectUnauthorized: false
 };
 */

configs = require('./config');

// importer.testRead();

db = mongoose.createConnection(env.DB_HOST, env.DB_NAME, env.DB_PORT, connectOptions);
Scheduler = require('./helpers/scheduler')(db, event);
db.on('error', function (err) {
    throw err;
});
db.once('open', function callback() {
	var port = parseInt(process.env.PORT) || 443;
	var instance = parseInt(process.env.NODE_APP_INSTANCE, 10) || 0;
    var scheduler = new Scheduler();

	port += instance;

    console.log('Connected to db is success');

    require('./models/index.js');

    app = require('./app')(db, event);

    httpServer = http.createServer(app);
    io = require('./helpers/socket')(httpServer, app);
    app.set('io', io);

    httpServer.listen(port, function () {
        console.log('==============================================================');
        console.log('|| server start success on port=' + port + ' in ' + env.NODE_ENV + ' version ||');
        console.log('==============================================================\n');
    });

    scheduler.initEveryHourScheduler();
});
