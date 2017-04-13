const _ = require('underscore');
const CONSTANTS = require('../../../public/js/constants/otherConstants');
const FilterMapper = require('../../../helpers/filterMapper');
const ConsumersSurveyModel = require('../../../types/consumersSurvey/model');
const mapFilterValues = require('../reusable-components/mapFilterValues');
const ACL_CONSTANTS = require('./../../../constants/aclRolesNames');

module.exports = (req, res, next) => {
    const personnel = req.personnelModel;
    const query = req.query;
    const filterMapper = new FilterMapper();
    const filter = filterMapper.mapFilter({
        filter: query.filter,
    });
    const locations = ['country', 'region', 'subRegion', 'branch'];
    const pipeLine = [];
    let positionFilter;

    pipeLine.push({
        $match: {
            $or: [
                {
                    'createdBy.user': personnel._id,
                    status: { $in: ['draft', 'expired'] },
                }, {
                    status: { $nin: ['draft', 'expired'] },
                },
            ],
        },
    });

    if (req.session.level === ACL_CONSTANTS.AREA_IN_CHARGE) {
        locations.pop();
    }

    const $locationMatch = {
        $and: [],
    };

    locations.forEach((location) => {
        if ((filter[location] && filter[location].$in && filter[location].$in.length) || (personnel[location] && personnel[location].length)) {
            $locationMatch.$and.push({
                $or: [
                    {
                        [location]: { $in: filter[location] && filter[location].$in || personnel[location] },
                    },
                    {
                        [location]: { $eq: [] },
                    },
                    {
                        [location]: { $eq: null },
                    },
                    {
                        'createdBy.user': { $eq: personnel._id },
                    },
                    {
                        personnels: personnel._id,
                    },
                ],
            });
        }
    });

    if ($locationMatch.$and.length) {
        pipeLine.push({
            $match: $locationMatch,
        });
    }

    if (filter.publisher) {
        pipeLine.push({
            $match: {
                'createdBy.user': filter.publisher,
            },
        });
    }

    pipeLine.push({
        $lookup: {
            from: 'personnels',
            localField: 'createdBy.user',
            foreignField: '_id',
            as: 'createdBy.user',
        },
    });

    pipeLine.push({
        $lookup: {
            from: 'personnels',
            localField: 'personnel',
            foreignField: '_id',
            as: 'personnel',
        },
    });

    pipeLine.push({
        $lookup: {
            from: 'domains',
            localField: 'country',
            foreignField: '_id',
            as: 'country',
        },
    });

    pipeLine.push({
        $lookup: {
            from: 'domains',
            localField: 'region',
            foreignField: '_id',
            as: 'region',
        },
    });

    pipeLine.push({
        $lookup: {
            from: 'domains',
            localField: 'subRegion',
            foreignField: '_id',
            as: 'subRegion',
        },
    });

    pipeLine.push({
        $lookup: {
            from: 'branches',
            localField: 'branch',
            foreignField: '_id',
            as: 'branch',
        },
    });

    pipeLine.push({
        $project: {
            title: 1,
            dueDate: 1,
            startDate: 1,
            status: 1,
            personnel: {
                $let: {
                    vars: {
                        personnel: { $arrayElemAt: ['$personnel', 0] },
                    },
                    in: {
                        _id: '$$personnel._id',
                        name: {
                            en: { $concat: ['$$personnel.firstName.en', ' ', '$$personnel.lastName.en'] },
                            ar: { $concat: ['$$personnel.firstName.ar', ' ', '$$personnel.lastName.ar'] },
                        },
                    },
                },
            },
            location: 1,
            country: {
                _id: 1,
                name: 1,
            },
            region: {
                _id: 1,
                name: 1,
                parent: 1,
            },
            subRegion: {
                _id: 1,
                name: 1,
                parent: 1,
            },
            retailSegment: 1,
            outlet: 1,
            branch: {
                _id: 1,
                name: 1,
                subRegion: 1,
                outlet: 1,
                retailSegment: 1,
            },
            countAnswered: 1,
            questions: 1,
            position: '$createdBy.user.position',
            createdBy: {
                user: {
                    $let: {
                        vars: {
                            personnel: { $arrayElemAt: ['$createdBy.user', 0] },
                        },
                        in: {
                            _id: '$$personnel._id',
                            position: '$$personnel.position',
                            firstName: '$$personnel.firstName',
                            lastName: '$$personnel.lastName',
                            name: {
                                en: { $concat: ['$$personnel.firstName.en', ' ', '$$personnel.lastName.en'] },
                                ar: { $concat: ['$$personnel.firstName.ar', ' ', '$$personnel.lastName.ar'] },
                            },
                        },
                    },
                },
                date: 1,
            },
            editedBy: 1,
        },
    });

    if (filter.position) {
        pipeLine.push({
            $match: {
                $or: [
                    {
                        position: filter.position,
                    },
                ],
            },
        });
    }

    if (filter.outlet) {
        pipeLine.push({
            $match: {
                $or: [
                    {
                        outlet: filter.outlet,
                    },
                    {
                        outlet: { $exists: false },
                    },
                ],
            },
        });
    }

    if (filter.retailSegment) {
        pipeLine.push({
            $match: {
                $or: [
                    {
                        retailSegment: filter.retailSegment,
                    },
                    {
                        retailSegment: { $exists: false },
                    },
                ],
            },
        });
    }

    pipeLine.push({
        $lookup: {
            from: 'positions',
            localField: 'position',
            foreignField: '_id',
            as: 'position',
        },
    });

    pipeLine.push({
        $lookup: {
            from: 'outlets',
            localField: 'outlet',
            foreignField: '_id',
            as: 'outlet',
        },
    });

    pipeLine.push({
        $lookup: {
            from: 'retailSegments',
            localField: 'retailSegment',
            foreignField: '_id',
            as: 'retailSegment',
        },
    });

    pipeLine.push({
        $project: {
            title: 1,
            dueDate: 1,
            startDate: 1,
            status: 1,
            personnel: 1,
            location: 1,
            country: 1,
            region: 1,
            subRegion: 1,
            retailSegment: {
                _id: 1,
                name: 1,
            },
            outlet: {
                _id: 1,
                name: 1,
            },
            branch: 1,
            countAnswered: 1,
            publisher: {
                _id: '$createdBy.user._id',
                position: '$createdBy.user.position',
                name: {
                    en: { $concat: ['$createdBy.user.firstName.en', ' ', '$createdBy.user.lastName.en'] },
                    ar: { $concat: ['$createdBy.user.firstName.ar', ' ', '$createdBy.user.lastName.ar'] },
                },
            },
            questions: 1,
            position: {
                _id: 1,
                name: 1,
            },
            createdBy: 1,
            editedBy: 1,
        },
    });

    pipeLine.push({
        $group: {
            _id: null,
            country: { $addToSet: '$country' },
            region: { $addToSet: '$region' },
            subRegion: { $addToSet: '$subRegion' },
            retailSegment: { $addToSet: '$retailSegment' },
            outlet: { $addToSet: '$outlet' },
            branch: { $addToSet: '$branch' },
            position: { $addToSet: '$position' },
            publisher: { $addToSet: '$publisher' },
            status: { $addToSet: '$status' },
            personnel: { $addToSet: '$personnel' },
        },
    });

    const aggregation = ConsumersSurveyModel.aggregate(pipeLine);

    aggregation.options = {
        allowDiskUse: true,
    };

    aggregation.exec((err, response) => {
        let result;
        if (err) {
            return next(err);
        }

        result = response[0] || {};

        result = {
            country: result.country && _.flatten(result.country) || [],
            region: result.region && _.flatten(result.region) || [],
            subRegion: result.subRegion && _.flatten(result.subRegion) || [],
            retailSegment: result.retailSegment && _.flatten(result.retailSegment) || [],
            outlet: result.outlet && _.flatten(result.outlet) || [],
            branch: result.branch && _.flatten(result.branch) || [],
            publisher: result.publisher || [],
            position: result.position && _.flatten(result.position) || [],
            personnel: result.personnel && _.flatten(result.personnel) || [],
            status: mapFilterValues(result.status, CONSTANTS.PROMOTION_UI_STATUSES),
        };

        Object.keys(result).forEach((key) => {
            const condition = ['publisher'].indexOf(key) !== -1 && positionFilter;
            let positions = [];
            if (positionFilter) {
                positions = positionFilter.$in.fromObjectID();
            }
            if (result[key]) {
                let i = result[key].length - 1;
                for (i; i >= 0; i--) {
                    if (!result[key][i] || !result[key][i]._id || (condition && result[key][i].position && positions.indexOf(result[key][i].position.toString()) === -1)) {
                        result[key].splice(i, 1);
                    }
                }
            }
        });

        res.status(200).send(result);
    });
};
