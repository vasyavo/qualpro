var mongoose = require('mongoose');
var CONTENT_TYPES = require('../public/js/constants/contentType.js');
var env = process.env;
var connectOptions;
var configs;

env.NODE_ENV = 'development';
configs = require('../config/' + env.NODE_ENV);

connectOptions = configs.mongoConfig;
require('../models/index.js');
db = mongoose.createConnection(env.DB_HOST, env.DB_NAME, env.DB_PORT, connectOptions);
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback() {

    var PersonnelModel = db.model(CONTENT_TYPES.PERSONNEL, mongoose.Schemas[CONTENT_TYPES.PERSONNEL]);
    var DomainModel = db.model(CONTENT_TYPES.DOMAIN, mongoose.Schemas[CONTENT_TYPES.DOMAIN]);
    var RetailSegmentModel = db.model(CONTENT_TYPES.RETAILSEGMENT, mongoose.Schemas[CONTENT_TYPES.RETAILSEGMENT]);
    var OutletModel = db.model(CONTENT_TYPES.OUTLET, mongoose.Schemas[CONTENT_TYPES.OUTLET]);
    var BranchModel = db.model(CONTENT_TYPES.BRANCH, mongoose.Schemas[CONTENT_TYPES.BRANCH]);
    var personnelUpdate = {};

    DomainModel.aggregate({
        $group: {_id: '$type', data: {$push: '$_id'}}
    }, function (err, res) {

        for (var i = 0; i < res.length; i++) {
            personnelUpdate[res[i]._id] = res[i].data;
        }

        RetailSegmentModel.find({}, {_id: 1}, function (err, res) {
            personnelUpdate.retailSegment = [];

            for (var i = 0; i < res.length; i++) {
                personnelUpdate.retailSegment.push(res[i].id)
            }

            OutletModel.find({}, {_id: 1}, function (err, res) {
                personnelUpdate.outlet = [];

                for (var i = 0; i < res.length; i++) {
                    personnelUpdate.outlet.push(res[i].id)
                }

                BranchModel.find({}, {_id: 1}, function (err, res) {
                    personnelUpdate.branch = [];

                    for (var i = 0; i < res.length; i++) {
                        personnelUpdate.branch.push(res[i].id)
                    }

                    PersonnelModel.findOneAndUpdate({}, personnelUpdate, {new: true}, function (err, res) {
                        console.dir(err);
                        console.dir(res);
                    })
                })
            })
        })
    });
});

