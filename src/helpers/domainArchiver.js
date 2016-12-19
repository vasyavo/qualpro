var CONTENT_TYPES = require('../public/js/constants/contentType.js');
var SomeEvents = require('./someEvents');
var someEvents = new SomeEvents();

function domainArchiver(Model, BranchModel) {
    var contentTypes = [CONTENT_TYPES.COUNTRY, CONTENT_TYPES.REGION, CONTENT_TYPES.SUBREGION, CONTENT_TYPES.BRANCH];
    var async = require('async');

    var archive = function (uId, model, ids, archived, topArchived, cb) {
        var query;
        var updater;
        
        if (!ids || ids.length === 0) {
            return cb(null);
        }

        query = {_id: {$in: ids}};
        updater = {
            archived: archived
        };

        updater.updatedBy = {
            user: uId,
            date: new Date()
        };

        updater.topArchived = topArchived;

        model.update(query, updater, {multi: true}, function (err, res) {
            if (err) {
                return cb(err);
            }

            if (res.length === 0 && model.modelName === 'domains') {
                BranchModel.update(query, {archived: archived}, {multi: true}, function (err, res) {
                    if (err) {
                        return cb(err);
                    }

                    cb(null, res);
                });
            } else {
                cb(null, res);
            }
        });
    };

    var getChildren = function (ids, cb) {
        var query;

        if (!ids || ids.length === 0) {
            return cb(null);
        }

        query = {parent: {$in: ids}};

        // todo manage issue: '_id' projection is not working, find returns full models.
        Model.find(query, '_id', function (err, docs) {
            var newIds;

            if (err) {
                return cb(err);
            }

            newIds = [];

            docs.forEach(function (doc) {
                newIds.push(doc._id);
            });

            if (newIds.length === 0) {
                BranchModel.find({subRegion: {$in: ids}}, function (err, docs) {
                    if (err) {
                        return cb(err);
                    }

                    docs.forEach(function (doc) {
                        newIds.push(doc._id);
                    });

                    cb(null, {ids: newIds, model: BranchModel});
                });
            } else {
                cb(null, {ids: newIds, model: Model});
            }
        });
    };

    var archiveAndReturnChildren = function (uId, model, ids, archived, topArchived, cb) {
        if (!ids) {
            return cb(null, []);
        }

        archive(uId, model, ids, archived, topArchived, function (err) {
            if (err) {
                return cb(err);
            }

            getChildren(ids, cb);
        });
    };

    this.archive = archive;

    this.archiveToEnd = function (uId, options, cb) {
        var currentIds = [];
        var model = Model;
        var ids = options.ids;
        var archived = options.archived;
        var topArchived = archived;
        var contentType = options.contentType;
        var PersonnelModel = options.Personnel;
        var SessionModel = options.Session;
        var indexNumber = contentTypes.indexOf(contentType);

        currentIds.add(ids);

        async.whilst(
            function () {
                return currentIds.length;
            },
            function (callback) {
                archiveAndReturnChildren(uId, model, currentIds, archived, topArchived, function (err, res) {
                    var newIds;

                    if (err) {
                        return callback(err);
                    }

                    if (archived && indexNumber !== -1 && indexNumber <= contentTypes.length) {
                        someEvents.locationArchived({
                            id       : currentIds,
                            type     : contentTypes[indexNumber],
                            Personnel: PersonnelModel,
                            Session  : SessionModel,
                            Branch   : BranchModel
                        }, function (err) {
                            if (err) {
                                return callback(err);
                            }

                            indexNumber++;

                            newIds = res.ids;

                            topArchived = false;
                            model = res.model;
                            currentIds.length = 0;
                            currentIds.add(newIds);

                            callback(null);
                        });

                    } else {
                        newIds = res.ids;

                        topArchived = false;
                        model = res.model;
                        currentIds.length = 0;
                        currentIds.add(newIds);

                        callback(null);
                    }
                });
            },
            function (err) {
                cb(err);
            }
        );
    };

}

module.exports = domainArchiver;
