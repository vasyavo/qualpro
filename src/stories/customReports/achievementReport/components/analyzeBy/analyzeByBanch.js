module.exports = (pipeline) => {
    pipeline.push({
        $unwind: '$branch',
    });

    pipeline.push({
        $group: {
            _id: '$branch',
            achievement: { $first: '$_id' },
            count: { $sum: 1 },
        },
    });

    pipeline.push({
        $lookup: {
            from: 'branches',
            localField: '_id',
            foreignField: '_id',
            as: 'branch',
        },
    });

    pipeline.push({
        $project: {
            _id: 1,
            count: 1,
            domain: {
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
    });

    pipeline.push({
        $lookup: {
            from: 'domains',
            localField: 'domain.subRegion',
            foreignField: '_id',
            as: 'subRegion',
        },
    });

    pipeline.push({
        $addFields: {
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
    });

    pipeline.push({
        $lookup: {
            from: 'domains',
            localField: 'subRegion.parent',
            foreignField: '_id',
            as: 'region',
        },
    });

    pipeline.push({
        $addFields: {
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
    });

    pipeline.push({
        $lookup: {
            from: 'domains',
            localField: 'region.parent',
            foreignField: '_id',
            as: 'country',
        },
    });

    pipeline.push({
        $addFields: {
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
    });

    pipeline.push({
        $group: {
            _id: null,
            data: {
                $addToSet: {
                    _id: '$domain._id',
                    name: '$domain.name',
                    count: '$count',
                    country: '$country',
                    region: '$region',
                    subRegion: '$subRegion',
                },
            },
            labels: {
                $addToSet: {
                    _id: '$domain._id', // <-- important fix magical duplication
                    en: {
                        $concat: ['$country.name.en', ' / ', '$region.name.en', ' / ', '$subRegion.name.en', ' -> ', '$domain.name.en'],
                    },
                    ar: {
                        $concat: ['$country.name.ar', ' / ', '$region.name.ar', ' / ', '$subRegion.name.ar', ' -> ', '$domain.name.ar'],
                    },
                },
            },
        },
    });

    pipeline.push({
        $project: {
            data: 1,
            labels: {
                en: 1,
                ar: 1,
            },
        },
    });
};
