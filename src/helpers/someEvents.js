var SomeEvents = function () {
    'use strict';

    var _ = require('underscore');
    var async = require('async');
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var logWriter = require('../helpers/logWriter');

    function deleteSession(ids, Session, cb) {
        var regExpArray = _.map(ids, function (id) {
            var idString = id.toString();

            return {session: {$regex: idString}};
        });

        var search;

        if (regExpArray.length) {
            search = {
                $or: regExpArray
            };

            Session.remove(search, function (err) {
                if (err) {
                    return cb(err);
                }

                cb(null);
            });
        } else {
            cb(null);
        }

    }

    this.personnelArchived = function (options) {
        var options = options || {};
        var ids = options.ids || [];
        var Session = options.Session;

        if (!Array.isArray(ids)) {
            ids = [ids];
        }

        deleteSession(ids, Session, function (err) {
            if (err) {
                return logWriter.log('someEvents_personnelArchived', err.message);
            }
        });
    };

    this.locationArchived = function (options, callback) {
        options = options || {};

        var searchObject = {};
        var locationId = options.id;
        var locationType = options.type;
        var Personnel = options.Personnel;
        var Branch = options.Branch;
        var Session = options.Session;

        if (!Array.isArray(locationId)) {
            locationId = [locationId];
        }

        searchObject[locationType] = {
            $in: locationId
        };

        async.waterfall([

            //if retailSegment or Outlet find Branches to them
            function (cb) {
                if (locationType === CONTENT_TYPES.COUNTRY || locationType === CONTENT_TYPES.REGION ||
                    locationType === CONTENT_TYPES.SUBREGION || locationType === CONTENT_TYPES.BRANCH) {
                    return cb(null, null);
                }

                Branch.find(searchObject, function (err, branchModels) {
                    var branchIds = [];
                    var newSearchObject = {};

                    if (err) {
                        return cb(err);
                    }

                    if (branchModels.length) {
                        branchModels.forEach(function (branch) {
                            branchIds.push(branch._id.toString());
                        });
                    }

                    newSearchObject[CONTENT_TYPES.BRANCH] = {
                        $in: branchIds
                    };

                    locationType = CONTENT_TYPES.BRANCH;

                    cb(null, newSearchObject);
                });
            },

            //find Personnels that have only that location
            function (newSearchObject, cb) {
                if (newSearchObject) {
                    searchObject = newSearchObject;
                }

                Personnel.find(searchObject, function (err, personnelModels) {
                    var ids = [];

                    if (err) {
                        return cb(err);
                    }

                    if (personnelModels.length) {
                        personnelModels.forEach(function (person, index) {
                            var personJSON = person.toJSON();
                            var updateObject;
                            var newLocationArray;

                            locationId = _.map(locationId, function (item) {
                                return item.toString();
                            });

                            personJSON[locationType] = _.map(personJSON[locationType], function (item) {
                                return item.toString();
                            });

                            newLocationArray = _.difference(personJSON[locationType], locationId);

                            if (!newLocationArray.length) {
                                ids.push(personJSON._id);
                            }

                            updateObject = {
                                $set: {}
                            };
                            updateObject.$set[locationType] = newLocationArray;

                            personnelModels[index].update(updateObject, function (err) {
                                if (err) {
                                    return cb(err);
                                }
                            });
                        });
                    }

                    cb(null, ids);
                });
            },

            //remove personnel Sessions
            function (ids, cb) {
                deleteSession(ids, Session, cb);
            }

        ], function (err) {
            if (err) {
                return callback(err);
            }

            callback();
        });
    };

};

module.exports = SomeEvents;