'use strict';

const ERROR_MESSAGES = require('../constants/errorMessages');
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
                { $unwind: '$accessRole' },
                {
                    $lookup: {
                        from: 'personnels',
                        localField: '_id',
                        foreignField: 'vacation.cover',
                        as: 'covers',
                    },
                },
                {
                    $project: {
                        _id: 1,
                        accessRole: 1,
                        email: 1,
                        country: 1,
                        branch: 1,
                        subRegion: 1,
                        region: 1,
                        covers: {
                            $filter: {
                                input: { $ifNull: ['$covers', []] },
                                as: 'item',
                                cond: { $eq: ['$$item.vacation.onLeave', true] },
                            },
                        },
                        coversWithNull: {
                            $filter: {
                                input: { $ifNull: ['$covers', []] },
                                as: 'item',
                                cond: { $and: [
                                    { $eq: ['$$item.vacation.onLeave', true] },
                                    { $eq: ['$$item.country', []] },
                                ] },
                            },
                        },
                    },
                },
                {
                    $project: {
                        _id: 1,
                        accessRole: 1,
                        coversWithNull: 1,
                        result: {
                            $reduce: {
                                input: '$covers',
                                initialValue: { country: '$country', branch: '$branch', subRegion: '$subRegion', region: '$region' },
                                in: {
                                    country: { $cond: { if: { $ne: ['$coversWithNull', []] }, then: [], else: '$result.country' } },
                                    branch: { $cond: { if: { $ne: ['$coversWithNull', []] }, then: [], else: '$result.branch' } },
                                    subRegion: { $cond: { if: { $ne: ['$coversWithNull', []] }, then: [], else: '$result.subRegion' } },
                                    region: { $cond: { if: { $ne: ['$coversWithNull', []] }, then: [], else: '$result.region' } },
                                },
                            },
                        },
                    },
                },

                {
                    $project: {
                        _id: 1,
                        accessRole: 1,
                        country: '$result.country',
                        branch: '$result.branch',
                        subRegion: '$result.subRegion',
                        region: '$result.region',
                    },
                }
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

        function isVacationAccessCMS (personnel) {
            const vacation = personnel.vacation && personnel.vacation.onLeave;
            const noMainAdmin = personnel.accessRole.level > 2;

            return noMainAdmin && vacation && accessType !== 'read' && !isMobile;
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

                if (!access[accessType]) {
                    const err = new Error();

                    err.status = 403;
                    return callback(err);
                }

                if (personnel.accessRole && isVacationAccessCMS(personnel)){
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

    const turnIntoPromise = (args, method) => {
        const request = args.req;
        const moduleId = args.mid;

        return new Promise((resolve, reject) => {
            method(request, moduleId, (err, allowed, personnel) => {
                if (err) {
                    return reject(err);
                }

                resolve(personnel);
            });
        });
    };

    const getReadAccessPromise = (req, mid) => {
        return turnIntoPromise({ req, mid }, getReadAccess);
    };
    const getEditAccessPromise = (req, mid) => {
        return turnIntoPromise({ req, mid }, getEditAccess);
    };
    const getWriteAccessPromise = (req, mid) => {
        return turnIntoPromise({ req, mid }, getWriteAccess);
    };
    const getArchiveAccessPromise = (req, mid) => {
        return turnIntoPromise({ req, mid }, getArchiveAccess);
    };

    return {
        getReadAccess,
        getEditAccess,
        getWriteAccess,
        getArchiveAccess,
        getEvaluateAccess,
        getUploadAccess,

        getReadAccessPromise,
        getEditAccessPromise,
        getWriteAccessPromise,
        getArchiveAccessPromise
    };
};

access.checkAuth = (req, res, next) => {
    if (req.session && req.session.loggedIn) {
        return next();
    }

    const err = new Error(ERROR_MESSAGES.NOT_AUTHORIZED);

    err.status = 401;
    next(err);
};

module.exports = access;
