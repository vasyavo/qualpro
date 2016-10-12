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

    var accessRoleShema = mongoose.Schemas[CONSTANTS.ACCESSROLE];
    var async = require('async');
    var AccessRoleModel = db.model(CONSTANTS.ACCESSROLE, accessRoleShema);
    var levels = {
        'Master Admin'    : 1,
        'Country Admin'   : 2,
        'Area Manager'    : 3,
        'Area in charge'  : 4,
        'Sales Man'       : 5,
        'Merchandiser'    : 6,
        'Cash van'        : 7,
        'Master uploader' : 8,
        'Country uploader': 9
    };

    AccessRoleModel
        .find({}, function (err, accessModels) {
            if (err) {
                return console.log(err);
            }

            async.each(accessModels,

                function (accessModel, cb) {
                    var name = accessModel.get('name.en');
                    var level = levels[name];

                    accessModel.update({$set: {level: level}}, function (err) {
                        if (err) {
                            return cb(err);
                        }

                        cb();
                    });

                }, function (err) {
                    if (err) {
                        return console.log(err);
                    }

                    console.log('=== AccessRoles updated successfully ===');
                });
        });
});
