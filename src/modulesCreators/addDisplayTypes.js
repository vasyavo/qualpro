var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017/qualPro';
var async = require('async');

MongoClient.connect(url, function (err, db) {
    var displayTypes;
    var _displayTypes;
    var q;

    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log('connected');

    displayTypes = db.collection('displayTypes');

    _displayTypes = [{
        _id : 1,
        name: {en: 'Shelf', ar: 'رف'}
    }, {
        _id : 2,
        name: {en: 'Block', ar: 'قاطع'}
    }, {
        _id : 3,
        name: {en: 'Gondola Head', ar: 'جندولة أمامية'}
    }, {
        _id : 4,
        name: {en: 'Gondola End', ar: 'جندولة خلفية'}
    }, {
        _id : 5,
        name: {en: 'Gondola', ar: 'جندولة'}
    }, {
        _id : 6,
        name: {en: 'Side Gondola', ar: 'جندولة جانبية'}
    }, {
        _id : 7,
        name: {en: 'Pallet', ar: 'طبلية'}
    }, {
        _id : 8,
        name: {en: 'Floor Display', ar: 'مساحة عرض أرضية'}
    }, {
        _id : 9,
        name: {en: 'Podium', ar: 'بوديوم'}
    }, {
        _id : 10,
        name: {en: 'Element', ar: 'مساحة عرض اضافية'}
    }, {
        _id : 11,
        name: {en: 'Stand', ar: 'استاند'}
    }, {
        _id : 12,
        name: {en: 'Side Stand', ar: 'استاند جانبي'}
    }, {
        _id : 13,
        name: {en: 'Thematic Stand', ar: 'استاند خاص بحملة ترويج معينة'}
    }, {
        _id : 14,
        name: {en: 'Promoter Stand', ar: 'استاند خاص بالعارضات'}
    }, {
        _id : 15,
        name: {en: 'Basket', ar: 'سلة'}
    }, {
        _id : 16,
        name: {en: 'Other', ar: 'آخر'}
    }];

    q = async.queue(function (currency, callback) {
        displayTypes.insertOne(currency, callback);
    }, 1000);

    q.drain = function () {
        console.log('All process done');
    };

    q.push(_displayTypes, function (err) {
        console.log('finished process');
        process.exit(0);
    });

});
