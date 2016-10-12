var access = function (db) {
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var mongoose = require('mongoose');
    var accessRoleSchema = mongoose.Schemas[CONTENT_TYPES.ACCESSROLE];
    var personnelSchema = mongoose.Schemas[CONTENT_TYPES.PERSONNEL];
    var async = require('async');

    var getAccess = function (req, mid, accessType, callback) {
        var PersonnelModel = db.model(CONTENT_TYPES.PERSONNEL, personnelSchema);
        var RoleModel = db.model(CONTENT_TYPES.ACCESSROLE, accessRoleSchema);
        var uId = req.session.uId;
        var isMobile = !!req.isMobile;
        var type = isMobile ? 'mobile' : 'cms';

        var tasks;

        function findPersonnel(waterfallCb) {
            PersonnelModel.findById(uId, waterfallCb);
        }

        function checkRole(personnel, waterfallCb) {
            var err;

            if (!personnel) {
                err = new Error('Such personnel probably don\'t exists');
                err.status = 400;

                return waterfallCb(err);
            }

            if (personnel.super === true) {
                return waterfallCb(null, [], personnel.toJSON());
            }

            RoleModel.aggregate([{
                $project: {
                    roleAccess: 1
                }
            }, {
                $match: {
                    _id: personnel.accessRole
                }
            }, {
                $unwind: '$roleAccess'
            }, {
                $match: {
                    'roleAccess.module': mid
                }
            }], function (err, result) {
                if (err) {
                    return waterfallCb(err);
                }

                waterfallCb(null, result, personnel.toJSON());
            });

            //waterfallCb();
        }

        tasks = [findPersonnel, checkRole];

        async.waterfall(tasks, function (err, result, personnel) {
            var access;

            if (err) {
                return callback(err);
            }

            if (result) {
                access = (result[0] && result[0].roleAccess) || {};
                access = access[type] || {};

                if (personnel.super) {
                    return callback(null, true, personnel);
                }

                return callback(null, access[accessType], personnel);
            }

            callback(null, false);
        });
    };

    var getReadAccess = function (req, mid, callback) {
        return getAccess(req, mid, 'read', callback);
    };
    var getEditAccess = function (req, mid, callback) {
        return getAccess(req, mid, 'edit', callback);
    };
    var getWriteAccess = function (req, mid, callback) {
        return getAccess(req, mid, 'write', callback);
    };
    var getArchiveAccess = function (req, mid, callback) {
        return getAccess(req, mid, 'archive', callback);
    };
    var getEvaluateAccess = function (req, mid, callback) {
        return getAccess(req, mid, 'evaluate', callback);
    };
    var getUploadAccess = function (req, mid, callback) {
        return getAccess(req, mid, 'upload', callback);
    };

    return {
        getReadAccess    : getReadAccess,
        getEditAccess    : getEditAccess,
        getWriteAccess   : getWriteAccess,
        getArchiveAccess : getArchiveAccess,
        getEvaluateAccess: getEvaluateAccess,
        getUploadAccess  : getUploadAccess
    };
};

access.checkAuth = function checkAuth(req, res, next) {
    var err;

    if (req.session && req.session.loggedIn) {
        next();
    } else {
        err = new Error('Not Authorized');
        err.status = 401;

        next(err);
    }
};

module.exports = access;
