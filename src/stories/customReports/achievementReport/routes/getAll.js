const mongoose = require('mongoose');
const async = require('async');
const _ = require('lodash');
const AccessManager = require('./../../../../helpers/access')();
const locationFiler = require('./../../utils/locationFilter');
const generalFiler = require('./../../utils/generalFilter');
const AchievementFormModel = require('./../../../../types/achievementForm/model');
const CONSTANTS = require('./../../../../constants/mainConstants');
const CONTENT_TYPES = require('./../../../../public/js/constants/contentType');
const ACL_MODULES = require('./../../../../constants/aclModulesNames');

const ObjectId = mongoose.Types.ObjectId;

module.exports = (req, res, next) => {
    const queryRun = (personnel, callback) => {
        const query = req.query;
        const queryFilter = query.filter || {};
        const page = query.page || 1;
        const limit = query.count * 1 || CONSTANTS.LIST_COUNT;
        const skip = (page - 1) * limit;
        const filters = [
            CONTENT_TYPES.COUNTRY, CONTENT_TYPES.REGION, CONTENT_TYPES.SUBREGION,
            CONTENT_TYPES.RETAILSEGMENT, CONTENT_TYPES.OUTLET, CONTENT_TYPES.BRANCH,
            CONTENT_TYPES.POSITION, CONTENT_TYPES.PERSONNEL,
        ];
        const pipeline = [];

        filters.forEach((filterName) => {
            if (queryFilter[filterName] && queryFilter[filterName][0]) {
                queryFilter[filterName] = queryFilter[filterName].map((item) => {
                    return ObjectId(item);
                });
            }
        });

        locationFiler(pipeline, personnel, queryFilter);

        const $generalMatch = generalFiler([CONTENT_TYPES.RETAILSEGMENT, CONTENT_TYPES.OUTLET], queryFilter, personnel);

        if (queryFilter[CONTENT_TYPES.PERSONNEL] && queryFilter[CONTENT_TYPES.PERSONNEL].length) {
            $generalMatch.$and.push({
                'createdBy.user': {
                    $in: _.union(queryFilter[CONTENT_TYPES.PERSONNEL], personnel._id),
                },
            });
        }

        if ($generalMatch.$and.length) {
            pipeline.push({
                $match: $generalMatch,
            });
        }

        pipeline.push({
            $lookup: {
                from: 'personnels',
                localField: 'createdBy.user',
                foreignField: '_id',
                as: 'createdBy.user',
            },
        });

        pipeline.push({
            $addFields: {
                createdBy: {
                    user: {
                        $let: {
                            vars: {
                                user: { $arrayElemAt: ['$createdBy.user', 0] },
                            },
                            in: {
                                _id: '$$user._id',
                                name: {
                                    en: { $concat: ['$$user.firstName.en', ' ', '$$user.lastName.en'] },
                                    ar: { $concat: ['$$user.firstName.ar', ' ', '$$user.lastName.ar'] },
                                },
                                position: '$$user.position',
                            },
                        },
                    },
                    date: 'createdBy.date',
                },
            },
        });

        if (queryFilter[CONTENT_TYPES.POSITION] && queryFilter[CONTENT_TYPES.POSITION].length) {
            pipeline.push({
                $match: {
                    'createdBy.user.position': {
                        $in: queryFilter[CONTENT_TYPES.POSITION],
                    },
                },
            });
        }

        pipeline.push({
            $group: {
                _id: null,
                total: { $sum: 1 },
                setAchievementForm: { $push: '$$ROOT' },
            },
        });

        pipeline.push({
            $unwind: '$setAchievementForm',
        });

        pipeline.push({
            $project: {
                _id: '$setAchievementForm._id',
                description: '$setAchievementForm.description',
                additionalComment: '$setAchievementForm.additionalComment',
                startDate: '$setAchievementForm.startDate',
                endDate: '$setAchievementForm.endDate',
                personnel: '$setAchievementForm.personnel',
                country: '$setAchievementForm.country',
                region: '$setAchievementForm.region',
                subRegion: '$setAchievementForm.subRegion',
                retailSegment: '$setAchievementForm.retailSegment',
                outlet: '$setAchievementForm.outlet',
                branch: '$setAchievementForm.branch',
                attachments: '$setAchievementForm.attachments',
                archived: '$setAchievementForm.archived',
                createdBy: '$setAchievementForm.createdBy',
                editedBy: '$setAchievementForm.editedBy',
                total: 1,
            },
        });

        pipeline.push({
            $skip: skip,
        });

        pipeline.push({
            $limit: limit,
        });

        pipeline.push({
            $group: {
                _id: null,
                total: { $first: '$total' },
                data: {
                    $push: '$$ROOT',
                },
            },
        });

        AchievementFormModel.aggregate(pipeline)
            .allowDiskUse(true)
            .exec(callback);
    };

    async.waterfall([
        (cb) => {
            AccessManager.getReadAccess(req, ACL_MODULES.ACHIEVEMENT_FORM, cb);
        },
        (allowed, personnel, cb) => {
            queryRun(personnel, cb);
        },
    ], (err, result) => {
        if (err) {
            return next(err);
        }

        const response = result.length ?
            result[0] : { data: [], total: 0 };

        res.status(200).send(response);
    });
};
