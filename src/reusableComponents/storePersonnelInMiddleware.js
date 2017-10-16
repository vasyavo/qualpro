const PersonnelModel = require('../types/personnel/model');
const mongoose = require('mongoose');

const ObjectId = mongoose.Types.ObjectId;

module.exports = (req, res, next) => {
    const uid = req.session.uId;

    PersonnelModel.aggregate(
        [
            {
                $match: {
                    _id: ObjectId(uid),
                },
            },

            {
                $lookup: {
                    from        : 'personnels',
                    localField  : '_id',
                    foreignField: 'vacation.cover',
                    as          : 'covers',
                },
            },
            {
                $project: {
                    country  : 1,
                    branch   : 1,
                    subRegion: 1,
                    region   : 1,
                    covers   : {
                        $filter: {
                            input: {$ifNull: ['$covers', []]},
                            as   : 'item',
                            cond : {$eq: ['$$item.vacation.onLeave', true]},
                        },
                    },
                },
            },
            {
                $project: {
                    covers              : 1,
                    country             : 1,
                    region              : 1,
                    subRegion           : 1,
                    branch              : 1,
                    mustHaveAllCountries: {
                        $let: {
                            vars: {
                                array: {
                                    $filter: {
                                        input: '$covers',
                                        as   : 'item',
                                        cond : {
                                            $or: [
                                                {
                                                    $eq: [
                                                        '$$item.country',
                                                        [],
                                                    ],
                                                },
                                                {
                                                    $eq: [
                                                        '$$item.country',
                                                        null,
                                                    ],
                                                },
                                            ],
                                        },
                                    },
                                },
                            },
                            in  : {
                                $cond: [{
                                    $eq: [{
                                        $size: '$$array',
                                    }, 0],
                                },
                                    false,
                                    true,
                                ],
                            },
                        },
                    },

                    mustHaveAllRegions: {
                        $let: {
                            vars: {
                                array: {
                                    $filter: {
                                        input: '$covers',
                                        as   : 'item',
                                        cond : {
                                            $or: [
                                                {
                                                    $eq: [
                                                        '$$item.region',
                                                        [],
                                                    ],
                                                },
                                                {
                                                    $eq: [
                                                        '$$item.region',
                                                        null,
                                                    ],
                                                },
                                            ],
                                        },
                                    },
                                },
                            },
                            in  : {
                                $cond: [{
                                    $eq: [{
                                        $size: '$$array',
                                    }, 0],
                                },
                                    false,
                                    true,
                                ],
                            },
                        },
                    },

                    mustHaveAllSubRegions: {
                        $let: {
                            vars: {
                                array: {
                                    $filter: {
                                        input: '$covers',
                                        as   : 'item',
                                        cond : {
                                            $or: [
                                                {
                                                    $eq: [
                                                        '$$item.subRegion',
                                                        [],
                                                    ],
                                                },
                                                {
                                                    $eq: [
                                                        '$$item.subRegion',
                                                        null,
                                                    ],
                                                },
                                            ],
                                        },
                                    },
                                },
                            },
                            in  : {
                                $cond: [{
                                    $eq: [{
                                        $size: '$$array',
                                    }, 0],
                                },
                                    false,
                                    true,
                                ],
                            },
                        },
                    },

                    mustHaveAllBranches: {
                        $let: {
                            vars: {
                                array: {
                                    $filter: {
                                        input: '$covers',
                                        as   : 'item',
                                        cond : {
                                            $or: [
                                                {
                                                    $eq: [
                                                        '$$item.branch',
                                                        [],
                                                    ],
                                                },
                                                {
                                                    $eq: [
                                                        '$$item.branch',
                                                        null,
                                                    ],
                                                },
                                            ],
                                        },
                                    },
                                },
                            },
                            in  : {
                                $cond: [{
                                    $eq: [{
                                        $size: '$$array',
                                    }, 0],
                                },
                                    false,
                                    true,
                                ],
                            },
                        },
                    },
                },
            },
            {
                $project: {
                    result: {
                        $reduce: {
                            input       : '$covers',
                            initialValue: {
                                country  : {$ifNull: ['$country', []]},
                                branch   : {$ifNull: ['$branch', []]},
                                subRegion: {$ifNull: ['$subRegion', []]},
                                region   : {$ifNull: ['$region', []]},
                            },
                            in          : {
                                country: {
                                    $cond: {
                                        if  : {
                                            $or: [{
                                                $eq: [
                                                    '$$value.country',
                                                    [],
                                                ],
                                            }, {
                                                $eq: [
                                                    '$mustHaveAllCountries',
                                                    true,
                                                ],
                                            },
                                            ],
                                        },
                                        then: [],
                                        else: {
                                            $setUnion: [
                                                '$$value.country',
                                                '$$this.country',
                                            ],
                                        },
                                    },
                                },

                                region: {
                                    $cond: {
                                        if  : {
                                            $or: [{
                                                $eq: [
                                                    '$$value.region',
                                                    [],
                                                ],
                                            }, {
                                                $eq: [
                                                    '$mustHaveAllRegions',
                                                    true,
                                                ],
                                            },
                                            ],
                                        },
                                        then: [],
                                        else: {
                                            $setUnion: [
                                                '$$value.region',
                                                '$$this.region',
                                            ],
                                        },
                                    },
                                },

                                subRegion: {
                                    $cond: {
                                        if  : {
                                            $or: [{
                                                $eq: [
                                                    '$$value.subRegion',
                                                    [],
                                                ],
                                            }, {
                                                $eq: [
                                                    '$mustHaveAllSubRegions',
                                                    true,
                                                ],
                                            },
                                            ],
                                        },
                                        then: [],
                                        else: {
                                            $setUnion: [
                                                '$$value.subRegion',
                                                '$$this.subRegion',
                                            ],
                                        },
                                    },
                                },

                                branch: {
                                    $cond: {
                                        if  : {
                                            $or: [{
                                                $eq: [
                                                    '$$value.branch',
                                                    [],
                                                ],
                                            }, {
                                                $eq: [
                                                    '$mustHaveAllBranches',
                                                    true,
                                                ],
                                            },
                                            ],
                                        },
                                        then: [],
                                        else: {
                                            $setUnion: [
                                                '$$value.branch',
                                                '$$this.branch',
                                            ],
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },

            {
                $project: {
                    country  : '$result.country',
                    branch   : '$result.branch',
                    subRegion: '$result.subRegion',
                    region   : '$result.region',
                },
            },
        ], (err, personnel) => {
            if (err) {
                return next(err);
            }

            if (personnel[0]) {
                req.personnelModel = personnel[0];
            }

            next();
        }
    );
};
