var mongoose = require('mongoose');
var CONSTANTS = require('../public/js/constants/contentType');
var env = process.env;
var connectOptions;
var configs;
var db;

env.NODE_ENV = 'development';
configs = require('../config/' + env.NODE_ENV);

connectOptions = configs.mongoConfig;
require('../models/index.js');

db = mongoose.createConnection(env.DB_HOST, env.DB_NAME, env.DB_PORT, connectOptions);
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback() {

    var brandSchema = mongoose.Schemas[CONSTANTS.BRAND];
    var async = require('async');
    var BrandModel = db.model(CONSTANTS.BRAND, brandSchema);

    BrandModel
        .find({'name.en': 'Al alali'}, function (err, models) {
            if (err) {
                return console.log(err);
            }

            if (!models.length) {
                return BrandModel
                    .create({
                        name: {
                            en: 'Al alali',
                            ar: 'Al alali'
                        },
                        ourCompany: true
                    }, function (err, model) {
                        if (err) {
                            return console.log(err);
                        }

                        console.log('=== Brand Al alali added ===');
                    });
            }

            console.log('=== Brand Al alali already exists! ===');
        });

});
