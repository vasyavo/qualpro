module.exports = (pipeline) => {
    pipeline.push({
        $lookup: {
            from: 'personnels',
            localField: 'consumer.createdBy.user',
            foreignField: '_id',
            as: 'publisher',
        },
    });

    pipeline.push({
        $addFields: {
            publisher: null,
            position: {
                $let: {
                    vars: {
                        publisher: { $arrayElemAt: ['$publisher', 0] },
                    },
                    in: '$$publisher.position',
                },
            },
        },
    });

    pipeline.push({
        $group: {
            _id: '$position',
            count: { $sum: 1 },
        },
    });

    pipeline.push({
        $lookup: {
            from: 'positions',
            localField: '_id',
            foreignField: '_id',
            as: 'position',
        },
    });

    pipeline.push({
        $project: {
            count: 1,
            position: {
                $let: {
                    vars: {
                        position: { $arrayElemAt: ['$position', 0] },
                    },
                    in: {
                        _id: '$$position._id',
                        name: '$$position.name',
                    },
                },
            },
        },
    });

    pipeline.push({
        $sort: {
            'position.name.en': 1,
        },
    });

    pipeline.push({
        $group: {
            _id: null,
            data: {
                $push: '$count',
            },
            labels: { $push: '$position.name' },
        },
    });

    pipeline.push({
        $project: {
            datasets: [{ data: '$data' }],
            labels: 1,
        },
    });
};
