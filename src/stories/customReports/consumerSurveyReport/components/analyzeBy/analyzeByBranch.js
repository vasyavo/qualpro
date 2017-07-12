module.exports = (pipeline) => {
    pipeline.push({
        $group: {
            _id: '$branch._id',
            region: { $first: '$region' },
            subRegion: { $first: '$subRegion' },
            branch: { $first: '$branch' },
            count: { $sum: 1 },
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
        $project: {
            count: 1,
            region: 1,
            subRegion: 1,
            branch: 1,
            country: {
                $let: {
                    vars: {
                        country: { $arrayElemAt: ['$country', 0] },
                    },
                    in: {
                        _id: '$$country._id',
                        name: '$$country.name',
                    },
                },
            },
        },
    });

    pipeline.push({
        $sort: {
            'country.name.en': 1,
            'region.name.en': 1,
            'subRegion.name.en': 1,
            'branch.name.en': 1,
        },
    });

    pipeline.push({
        $group: {
            _id: null,
            data: {
                $push: '$count',
            },
            labels: {
                $push: {
                    en: {
                        $concat: [
                            '$country.name.en',
                            ' / ',
                            '$region.name.en',
                            ' / ',
                            '$subRegion.name.en',
                            ' / ',
                            '$branch.name.en',
                        ],
                    },
                    ar: {
                        $concat: [
                            '$country.name.ar',
                            ' / ',
                            '$region.name.ar',
                            ' / ',
                            '$subRegion.name.ar',
                            ' / ',
                            '$branch.name.ar',
                        ],
                    },
                },
            },
        },
    });

    pipeline.push({
        $project: {
            datasets: [{ data: '$data' }],
            labels: 1,
        },
    });
};
