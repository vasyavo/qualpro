const mongoose = require('mongoose');
const async = require('async');
const Ajv = require('ajv');
const AccessManager = require('./../../../../helpers/access')();
const locationFiler = require('./../../utils/locationFilter');
const generalFiler = require('./../../utils/generalFilter');
const AchievementFormModel = require('./../../../../types/achievementForm/model');
const CONSTANTS = require('./../../../../constants/mainConstants');
const CONTENT_TYPES = require('./../../../../public/js/constants/contentType');
const ACL_MODULES = require('./../../../../constants/aclModulesNames');
const moment = require('moment');

const ajv = new Ajv();
const ObjectId = mongoose.Types.ObjectId;

module.exports = (req, res, next) => {
    const timeFilterSchema = {
        type: 'object',
        properties: {
            from: {
                type: 'string',
            },
            to: {
                type: 'string',
            },
        },
        required: [
            'from',
            'to',
        ],
    };

    const queryRun = (personnel, callback) => {
        const query = req.query;
        const timeFilter = query.timeFilter;
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

        if (timeFilter) {
            const timeFilterValidate = ajv.compile(timeFilterSchema);
            const timeFilterValid = timeFilterValidate(timeFilter);

            if (!timeFilterValid) {
                const err = new Error(timeFilterValidate.errors[0].message);

                err.status = 400;

                return next(err);
            }
        }

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
                    $in: queryFilter[CONTENT_TYPES.PERSONNEL],
                },
            });
        }

        if (timeFilter) {
            $generalMatch.$and = [
                {
                    'createdBy.date': { $gt: moment(timeFilter.from, 'MM/DD/YYYY')._d },
                },
                {
                    'createdBy.date': { $lt: moment(timeFilter.to, 'MM/DD/YYYY')._d },
                },
            ];
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
                    date: '$createdBy.date',
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

        pipeline.push(...[
            {
                $lookup: {
                    from: 'branches',
                    localField: 'branch',
                    foreignField: '_id',
                    as: 'branch',
                },
            },
            {
                $addFields: {
                    branch: {
                        $let: {
                            vars: {
                                branch: { $arrayElemAt: ['$branch', 0] },
                            },
                            in: {
                                _id: '$$branch._id',
                                name: {
                                    en: '$$branch.name.en',
                                    ar: '$$branch.name.ar',
                                },
                                subRegion: '$$branch.subRegion',
                            },
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: 'domains',
                    localField: 'branch.subRegion',
                    foreignField: '_id',
                    as: 'subRegion',
                },
            },
            {
                $addFields: {
                    branch: {
                        _id: '$branch._id',
                        name: '$branch.name',
                    },
                    subRegion: {
                        $let: {
                            vars: {
                                subRegion: { $arrayElemAt: ['$subRegion', 0] },
                            },
                            in: {
                                _id: '$$subRegion._id',
                                name: {
                                    en: '$$subRegion.name.en',
                                    ar: '$$subRegion.name.ar',
                                },
                                parent: '$$subRegion.parent',
                            },
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: 'domains',
                    localField: 'subRegion.parent',
                    foreignField: '_id',
                    as: 'region',
                },
            },
            {
                $addFields: {
                    subRegion: {
                        _id: '$subRegion._id',
                        name: '$subRegion.name',
                    },
                    region: {
                        $let: {
                            vars: {
                                region: { $arrayElemAt: ['$region', 0] },
                            },
                            in: {
                                _id: '$$region._id',
                                name: {
                                    en: '$$region.name.en',
                                    ar: '$$region.name.ar',
                                },
                                parent: '$$region.parent',
                            },
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: 'domains',
                    localField: 'region.parent',
                    foreignField: '_id',
                    as: 'country',
                },
            },
            {
                $addFields: {
                    region: {
                        _id: '$region._id',
                        name: '$region.name',
                    },
                    country: {
                        $let: {
                            vars: {
                                country: { $arrayElemAt: ['$country', 0] },
                            },
                            in: {
                                _id: '$$country._id',
                                name: {
                                    en: '$$country.name.en',
                                    ar: '$$country.name.ar',
                                },
                            },
                        },
                    },
                },
            },
            {
                $addFields: {
                    country: {
                        _id: '$country._id',
                        name: '$country.name',
                    },
                    location: {
                        $concat: ['$country.name.en', ' -> ', '$region.name.en', ' -> ', '$subRegion.name.en', ' -> ', '$branch.name.en'],
                    },
                },
            },
            {
                $sort: {
                    location: 1,
                },
            },
        ]);

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
