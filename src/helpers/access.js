'use strict';

const async = require('async');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const PersonnelModel = require('./../types/personnel/model');
const RoleModel = require('./../types/accessRole/model');

const access = () => {
    const getAccess = (req, mid, accessType, callback) => {
        const uid = req.session.uId;
        const isMobile = !!req.isMobile;
        const type = isMobile ? 'mobile' : 'cms';

        function findPersonnel(cb) {
            const pipeline = [
                { $match: { _id: ObjectId(uid) }},
                { $lookup: {
                    from: 'accessRoles',
                    localField: 'accessRole',
                    foreignField: '_id',
                    as: 'accessRole'
                }},
                { $unwind: '$accessRole' }
            ];

            PersonnelModel.aggregate(pipeline, cb);
        }

        function checkRole(arrayOfPersonnel, cb) {
            const personnel = arrayOfPersonnel.pop();

            if (!personnel) {
                const err = new Error('Such personnel probably don\'t exists');

                err.status = 400;
                return cb(err);
            }

            if (personnel.super === true) {
                return cb(null, [], personnel);
            }

            RoleModel.aggregate([{
                $project : {
                    roleAccess : 1
                }
            }, {
                $match : {
                    _id : personnel.accessRole._id
                }
            }, {
                $unwind : '$roleAccess'
            }, {
                $match : {
                    'roleAccess.module' : mid
                }
            }], (err, result) => {
                if (err) {
                    return cb(err);
                }

                cb(null, result, personnel);
            });
        }

        async.waterfall([
            findPersonnel,
            checkRole
        ], (err, result, personnel) => {
            if (err) {
                return callback(err);
            }

            let access;

            if (result) {
                access = (result[0] && result[0].roleAccess) || {};
                access = access[type] || {};

                if (personnel.super) {
                    return callback(null, true, personnel);
                }

                if (!access[accessType] || (personnel.accessRole && personnel.accessRole.level > 2 && personnel.vacation && personnel.vacation.onLeave  && accessType !== 'read' && !isMobile)) {
                    const err = new Error();

                    err.status = 403;
                    return callback(err);
                }

                return callback(null, access[accessType], personnel);
            }

            callback(null, false);
        });
    };

    const getReadAccess = (req, mid, callback) => {
        return getAccess(req, mid, 'read', callback);
    };
    const getEditAccess = (req, mid, callback) => {
        return getAccess(req, mid, 'edit', callback);
    };
    const getWriteAccess = (req, mid, callback) => {
        return getAccess(req, mid, 'write', callback);
    };
    const getArchiveAccess = (req, mid, callback) => {
        return getAccess(req, mid, 'archive', callback);
    };
    const getEvaluateAccess = (req, mid, callback) => {
        return getAccess(req, mid, 'evaluate', callback);
    };
    const getUploadAccess = (req, mid, callback) => {
        return getAccess(req, mid, 'upload', callback);
    };

    return {
        getReadAccess,
        getEditAccess,
        getWriteAccess,
        getArchiveAccess,
        getEvaluateAccess,
        getUploadAccess
    };
};

access.checkAuth = (req, res, next) => {
    if (req.session && req.session.loggedIn) {
        return next();
    }

    const err = new Error('Not Authorized');

    err.status = 401;
    next(err);
};

module.exports = access;
