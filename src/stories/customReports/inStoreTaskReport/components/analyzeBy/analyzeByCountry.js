module.exports = (pipeline) => {
    pipeline.push({
        $unwind: '$country',
    });

    pipeline.push({
        $group: {
            _id: '$country',
            count: { $sum: 1 },
        },
    });

    pipeline.push({
        $lookup: {
            from: 'domains',
            localField: '_id',
            foreignField: '_id',
            as: 'country',
        },
    });


    pipeline.push({
        $match: {
            country: { $ne: [] },
        },
    });

    pipeline.push({
        $project: {
            count: 1,
            country: {
                $let: {
                    vars: {
                        country: { $arrayElemAt: ['$country', 0] },
                    },
                    in: {
                        _id: '$$country._id',
                        name: {
                            en: { $concat: ['$$country.name.en', ' ', '$$country.name.en'] },
                            ar: { $concat: ['$$country.name.ar', ' ', '$$country.name.ar'] },
                        },
                    },
                },
            },
        },
    });

    pipeline.push({
        $group: {
            _id: null,
            data: { $push: '$count' },
            labels: { $push: '$country' },
        },
    });
};
