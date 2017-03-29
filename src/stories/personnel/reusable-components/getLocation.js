const DomainCollection = require('./../../../types/domain/collection');

module.exports = (options, callback) => {
    const {
        setCountry,
        setRegion,
        setSubRegion,
    } = options;

    const pipeline = [{
        $project: {
            _id: 1,
            'name.en': 1,
            'name.ar': 1,
            type: 1,
            parent: 1,
        },
    }, {
        $group: {
            _id: null,
            setDomain: {
                $push: '$$ROOT',
            },
        },
    }, {
        $project: {
            setDomain: 1,
            setCountry: {
                $let: {
                    vars: {
                        setCountry,
                    },
                    in: {
                        $cond: {
                            if: {
                                $gt: [{
                                    $size: '$$setCountry',
                                }, 0],
                            },
                            then: '$$setCountry',
                            else: {
                                $filter: {
                                    input: '$setDomain',
                                    as: 'item',
                                    cond: {
                                        $eq: ['$$item.type', 'country'],
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    }, {
        $project: {
            setDomain: 1,
            setCountry: 1,
            setRegion: {
                $let: {
                    vars: {
                        setRegion,
                    },
                    in: {
                        $cond: {
                            if: {
                                $gt: [{
                                    $size: '$$setRegion',
                                }, 0],
                            },
                            then: '$$setRegion',
                            else: {
                                $let: {
                                    vars: {
                                        setId: '$setCountry._id',
                                    },
                                    in: {
                                        $filter: {
                                            input: '$setDomain',
                                            as: 'item',
                                            cond: {
                                                $and: [{
                                                    $eq: ['$$item.type', 'region'],
                                                }, {
                                                    $setIsSubset: [['$$item.parent'], '$$setId'],
                                                }],
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    }, {
        $project: {
            setDomain: 1,
            setCountry: 1,
            setRegion: 1,
            setSubRegion: {
                $let: {
                    vars: {
                        setSubRegion,
                    },
                    in: {
                        $cond: {
                            if: {
                                $gt: [{
                                    $size: '$$setSubRegion',
                                }, 0],
                            },
                            then: '$$setSubRegion',
                            else: {
                                $let: {
                                    vars: {
                                        setId: '$setRegion._id',
                                    },
                                    in: {
                                        $filter: {
                                            input: '$setDomain',
                                            as: 'item',
                                            cond: {
                                                $and: [{
                                                    $eq: ['$$item.type', 'subRegion'],
                                                }, {
                                                    $setIsSubset: [['$$item.parent'], '$$setId'],
                                                }],
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    }, {
        $project: {
            setCountry: {
                _id: 1,
                name: 1,
            },
            setRegion: {
                _id: 1,
                name: 1,
            },
            setSubRegion: {
                _id: 1,
                name: 1,
            },
        },
    }];

    DomainCollection.aggregate(pipeline, callback);
};
