var CONSTANTS = require('../constants/mainConstants');

var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017/qualPro';
var async = require('async');

MongoClient.connect(url, function (err, db) {

    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log('connected');

    var currencies = db.collection('currencies');

    var _currencies = [{
        _id : 'AED',
        name: 'Dirham (AED)'
    }, {
        _id : 'IQD',
        name: 'Iraqi Dinar (IQD)'
    }, {
        _id : 'JOD',
        name: 'Jordanian Dinar (JOD)'
    }, {
        _id : 'KWD',
        name: 'Kuwaiti Dinar (KWD)'
    }, {
        _id : 'OMR',
        name: 'Omani Rial (OMR)'
    }, {
        _id : 'QAR',
        name: 'Qatari Riyal (QAR)'
    }, {
        _id : 'SAR',
        name: 'Saudi Arabian Riyal (SAR)'
    }, {
        _id : 'SDG',
        name: 'Sudanese Pound (SDG)'
    }, {
        _id : 'SYP',
        name: 'Syrian Pound (SYP)'
    }, {
        _id : 'BHD',
        name: 'Bahraini Dinar (BHD)'
    }, {
        _id : 'YER',
        name: 'Emeni Rial (YER)'
    }];

    var q = async.queue(function (currency, callback) {
        currencies.insertOne(currency, callback);
    }, 1000);

    q.drain = function () {
        console.log('All process done');
    };

    q.push(_currencies, function (err) {
        console.log('finished process');
    });

});
