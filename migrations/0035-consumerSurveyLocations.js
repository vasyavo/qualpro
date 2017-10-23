const async = require('async');
const logger = require('./../src/utils/logger');
const contentTypes = require('./../src/public/js/constants/contentType');

require('mongodb');

exports.up = function (db, next) {
    const cursor = db.collection(contentTypes.CONSUMER_SURVEY).aggregate([{
        $lookup: {
            from        : 'branches',
            localField  : 'branch',
            foreignField: '_id',
            as          : 'branch',
        },
    }, {
        $lookup: {
            from        : 'retailSegments',
            localField  : 'retailSegment',
            foreignField: '_id',
            as          : 'retailSegment',
        },
    }, {
        $lookup: {
            from        : 'outlets',
            localField  : 'outlet',
            foreignField: '_id',
            as          : 'outlet',
        },
    }, {
        $lookup: {
            from        : 'domains',
            localField  : 'subRegion',
            foreignField: '_id',
            as          : 'subRegion',
        },
    }, {
        $lookup: {
            from        : 'domains',
            localField  : 'region',
            foreignField: '_id',
            as          : 'region',
        },
    }, {
        $lookup: {
            from        : 'domains',
            localField  : 'country',
            foreignField: '_id',
            as          : 'country',
        },
    }, {
        $lookup: {
            from        : 'personnels',
            localField  : 'createdBy.user',
            foreignField: '_id',
            as          : 'createdBy.user',
        },
    }, {
        $lookup: {
            from        : 'positions',
            localField  : 'createdBy.user.position',
            foreignField: '_id',
            as          : 'position',
        },
    }, {
        $lookup: {
            from        : 'personnels',
            localField  : 'personnel',
            foreignField: '_id',
            as          : 'personnel',
        },
    }, {
        $project: {
            location: {
                ar: {
                    $concat: [
                        {
                            $cond: [
                                {
                                    $or: [
                                        {
                                            $eq: ['$country', null],
                                        }, {
                                            $eq: ['$country', []],
                                        },
                                    ],
                                },
                                '',
                                {
                                    $reduce: {
                                        input       : '$country',
                                        initialValue: '',
                                        in          : {
                                            $cond: [
                                                {
                                                    $eq: ['$$value', ''],
                                                },
                                                '$$this.name.ar',
                                                {
                                                    $concat: ['$$value', ', ', '$$this.name.ar'],
                                                },
                                            ],
                                        },
                                    },
                                },
                            ],
                        }, {
                            $cond: [
                                {
                                    $or: [
                                        {
                                            $eq: ['$region', null],
                                        }, {
                                            $eq: ['$region', []],
                                        },
                                    ],
                                },
                                '',
                                {
                                    $concat: [' > ', {
                                        $reduce: {
                                            input       : '$region',
                                            initialValue: '',
                                            in          : {
                                                $cond: [
                                                    {
                                                        $eq: ['$$value', ''],
                                                    },
                                                    '$$this.name.ar',
                                                    {
                                                        $concat: ['$$value', ', ', '$$this.name.ar'],
                                                    },
                                                ],
                                            },
                                        },
                                    }],
                                },
                            ],
                        }, {
                            $cond: [
                                {
                                    $or: [
                                        {
                                            $eq: ['$subRegion', null],
                                        }, {
                                            $eq: ['$subRegion', []],
                                        },
                                    ],
                                },
                                '',
                                {
                                    $concat: [' > ', {
                                        $reduce: {
                                            input       : '$subRegion',
                                            initialValue: '',
                                            in          : {
                                                $cond: [
                                                    {
                                                        $eq: ['$$value', ''],
                                                    },
                                                    '$$this.name.ar',
                                                    {
                                                        $concat: ['$$value', ', ', '$$this.name.ar'],
                                                    },
                                                ],
                                            },
                                        },
                                    }],
                                },
                            ],
                        }, {
                            $cond: [
                                {
                                    $or: [
                                        {
                                            $eq: ['$retailSegment', null],
                                        }, {
                                            $eq: ['$retailSegment', []],
                                        },
                                    ],
                                },
                                '',
                                {
                                    $concat: [' > ', {
                                        $reduce: {
                                            input       : '$retailSegment',
                                            initialValue: '',
                                            in          : {
                                                $cond: [
                                                    {
                                                        $eq: ['$$value', ''],
                                                    },
                                                    '$$this.name.ar',
                                                    {
                                                        $concat: ['$$value', ', ', '$$this.name.ar'],
                                                    },
                                                ],
                                            },
                                        },
                                    }],
                                },
                            ],
                        }, {
                            $cond: [
                                {
                                    $or: [
                                        {
                                            $eq: ['$outlet', null],
                                        }, {
                                            $eq: ['$outlet', []],
                                        },
                                    ],
                                },
                                '',
                                {
                                    $concat: [' > ', {
                                        $reduce: {
                                            input       : '$outlet',
                                            initialValue: '',
                                            in          : {
                                                $cond: [
                                                    {
                                                        $eq: ['$$value', ''],
                                                    },
                                                    '$$this.name.ar',
                                                    {
                                                        $concat: ['$$value', ', ', '$$this.name.ar'],
                                                    },
                                                ],
                                            },
                                        },
                                    }],
                                },
                            ],
                        }, {
                            $cond: [
                                {
                                    $or: [
                                        {
                                            $eq: ['$branch', null],
                                        }, {
                                            $eq: ['$branch', []],
                                        },
                                    ],
                                },
                                '',
                                {
                                    $concat: [' > ', {
                                        $reduce: {
                                            input       : '$branch',
                                            initialValue: '',
                                            in          : {
                                                $cond: [
                                                    {
                                                        $eq: ['$$value', ''],
                                                    },
                                                    '$$this.name.ar',
                                                    {
                                                        $concat: ['$$value', ', ', '$$this.name.ar'],
                                                    },
                                                ],
                                            },
                                        },
                                    }],
                                },
                            ],
                        }, {
                            $cond: [
                                {
                                    $or: [
                                        {
                                            $eq: ['$position', null],
                                        }, {
                                            $eq: ['$position', []],
                                        },
                                    ],
                                },
                                '',
                                {
                                    $concat: [' > ', {
                                        $reduce: {
                                            input       : '$position',
                                            initialValue: '',
                                            in          : {
                                                $cond: [
                                                    {
                                                        $eq: ['$$value', ''],
                                                    },
                                                    '$$this.name.ar',
                                                    {
                                                        $concat: ['$$value', ', ', '$$this.name.ar'],
                                                    },
                                                ],
                                            },
                                        },
                                    }],
                                },
                            ],
                        }, {
                            $cond: [
                                {
                                    $or: [
                                        {
                                            $eq: ['$personnel', null],
                                        }, {
                                            $eq: ['$personnel', []],
                                        },
                                    ],
                                },
                                '',
                                {
                                    $concat: [' > ', {
                                        $reduce: {
                                            input       : '$personnel',
                                            initialValue: '',
                                            in          : {
                                                $cond: [
                                                    {
                                                        $eq: ['$$value', ''],
                                                    },
                                                    {
                                                        $concat: ['$$this.firstName.ar', ' ', '$$this.lastName.ar'],
                                                    },
                                                    {
                                                        $concat: ['$$value', ', ', '$$this.firstName.ar', ' ', '$$this.lastName.ar'],
                                                    },
                                                ],
                                            },
                                        },
                                    }],
                                },
                            ],
                        },
                    ],
                },
                en: {
                    $concat: [
                        {
                            $cond: [
                                {
                                    $or: [
                                        {
                                            $eq: ['$country', null],
                                        }, {
                                            $eq: ['$country', []],
                                        },
                                    ],
                                },
                                '',
                                {
                                    $reduce: {
                                        input       : '$country',
                                        initialValue: '',
                                        in          : {
                                            $cond: [
                                                {
                                                    $eq: ['$$value', ''],
                                                },
                                                '$$this.name.en',
                                                {
                                                    $concat: ['$$value', ', ', '$$this.name.en'],
                                                },
                                            ],
                                        },
                                    },
                                },
                            ],
                        }, {
                            $cond: [
                                {
                                    $or: [
                                        {
                                            $eq: ['$region', null],
                                        }, {
                                            $eq: ['$region', []],
                                        },
                                    ],
                                },
                                '',
                                {
                                    $concat: [' > ', {
                                        $reduce: {
                                            input       : '$region',
                                            initialValue: '',
                                            in          : {
                                                $cond: [
                                                    {
                                                        $eq: ['$$value', ''],
                                                    },
                                                    '$$this.name.en',
                                                    {
                                                        $concat: ['$$value', ', ', '$$this.name.en'],
                                                    },
                                                ],
                                            },
                                        },
                                    }],
                                },
                            ],
                        }, {
                            $cond: [
                                {
                                    $or: [
                                        {
                                            $eq: ['$subRegion', null],
                                        }, {
                                            $eq: ['$subRegion', []],
                                        },
                                    ],
                                },
                                '',
                                {
                                    $concat: [' > ', {
                                        $reduce: {
                                            input       : '$subRegion',
                                            initialValue: '',
                                            in          : {
                                                $cond: [
                                                    {
                                                        $eq: ['$$value', ''],
                                                    },
                                                    '$$this.name.en',
                                                    {
                                                        $concat: ['$$value', ', ', '$$this.name.en'],
                                                    },
                                                ],
                                            },
                                        },
                                    }],
                                },
                            ],
                        }, {
                            $cond: [
                                {
                                    $or: [
                                        {
                                            $eq: ['$retailSegment', null],
                                        }, {
                                            $eq: ['$retailSegment', []],
                                        },
                                    ],
                                },
                                '',
                                {
                                    $concat: [' > ', {
                                        $reduce: {
                                            input       : '$retailSegment',
                                            initialValue: '',
                                            in          : {
                                                $cond: [
                                                    {
                                                        $eq: ['$$value', ''],
                                                    },
                                                    '$$this.name.en',
                                                    {
                                                        $concat: ['$$value', ', ', '$$this.name.en'],
                                                    },
                                                ],
                                            },
                                        },
                                    }],
                                },
                            ],
                        }, {
                            $cond: [
                                {
                                    $or: [
                                        {
                                            $eq: ['$outlet', null],
                                        }, {
                                            $eq: ['$outlet', []],
                                        },
                                    ],
                                },
                                '',
                                {
                                    $concat: [' > ', {
                                        $reduce: {
                                            input       : '$outlet',
                                            initialValue: '',
                                            in          : {
                                                $cond: [
                                                    {
                                                        $eq: ['$$value', ''],
                                                    },
                                                    '$$this.name.en',
                                                    {
                                                        $concat: ['$$value', ', ', '$$this.name.en'],
                                                    },
                                                ],
                                            },
                                        },
                                    }],
                                },
                            ],
                        }, {
                            $cond: [
                                {
                                    $or: [
                                        {
                                            $eq: ['$branch', null],
                                        }, {
                                            $eq: ['$branch', []],
                                        },
                                    ],
                                },
                                '',
                                {
                                    $concat: [' > ', {
                                        $reduce: {
                                            input       : '$branch',
                                            initialValue: '',
                                            in          : {
                                                $cond: [
                                                    {
                                                        $eq: ['$$value', ''],
                                                    },
                                                    '$$this.name.en',
                                                    {
                                                        $concat: ['$$value', ', ', '$$this.name.en'],
                                                    },
                                                ],
                                            },
                                        },
                                    }],
                                },
                            ],
                        }, {
                            $cond: [
                                {
                                    $or: [
                                        {
                                            $eq: ['$position', null],
                                        }, {
                                            $eq: ['$position', []],
                                        },
                                    ],
                                },
                                '',
                                {
                                    $concat: [' > ', {
                                        $reduce: {
                                            input       : '$position',
                                            initialValue: '',
                                            in          : {
                                                $cond: [
                                                    {
                                                        $eq: ['$$value', ''],
                                                    },
                                                    '$$this.name.en',
                                                    {
                                                        $concat: ['$$value', ', ', '$$this.name.en'],
                                                    },
                                                ],
                                            },
                                        },
                                    }],
                                },
                            ],
                        }, {
                            $cond: [
                                {
                                    $or: [
                                        {
                                            $eq: ['$personnel', null],
                                        }, {
                                            $eq: ['$personnel', []],
                                        },
                                    ],
                                },
                                '',
                                {
                                    $concat: [' > ', {
                                        $reduce: {
                                            input       : '$personnel',
                                            initialValue: '',
                                            in          : {
                                                $cond: [
                                                    {
                                                        $eq: ['$$value', ''],
                                                    },
                                                    {
                                                        $concat: ['$$this.firstName.en', ' ', '$$this.lastName.en'],
                                                    },
                                                    {
                                                        $concat: ['$$value', ', ', '$$this.firstName.en', ' ', '$$this.lastName.en'],
                                                    },
                                                ],
                                            },
                                        },
                                    }],
                                },
                            ],
                        },
                    ],
                },
            },
        },
    },], {allowDiskUse: true});
    const queue = async.queue((doc, queueCb) => {
        if (!doc) {
            cursor.close();

            return queueCb();
        }

        db.collection(contentTypes.CONSUMER_SURVEY).updateOne({
            _id: doc._id,
        }, {
            $set: {
                location: doc.location,
            },
        }, queueCb);
    }, Infinity);

    cursor.each((err, doc) => {
        if (err) {
            return logger.error('ConsumersSurvey pick fails', err);
        }

        queue.push(doc);
    });

    queue.drain = () => {
        if (cursor.isClosed()) {
            return next();
        }
    };
};

exports.down = function (db, next) {
    next();
};
