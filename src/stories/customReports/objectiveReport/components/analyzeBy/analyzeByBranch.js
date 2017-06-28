module.exports = (pipeline) => {
    pipeline.push({
        $unwind: '$branch',
    });

    pipeline.push({
        $group: {
            _id: {
                branch: '$branch',
                status: '$status',
            },
            count: { $sum: 1 },
        },
    });

    pipeline.push({
        $lookup: {
            from: 'branches',
            localField: '_id.branch',
            foreignField: '_id',
            as: 'branch',
        },
    });


    pipeline.push({
        $match: {
            branch: { $ne: [] },
        },
    });

    pipeline.push({
        $project: {
            count: 1,
            branch: {
                $let: {
                    vars: {
                        branch: { $arrayElemAt: ['$branch', 0] },
                    },
                    in: {
                        _id: '$$branch._id',
                        name: {
                            en: { $concat: ['$$branch.name.en', ' ', '$$branch.name.en'] },
                            ar: { $concat: ['$$branch.name.ar', ' ', '$$branch.name.ar'] },
                        },
                    },
                },
            },
        },
    });

    pipeline.push({
        $sort: {
            '_id.status': 1,
        },
    });

    pipeline.push({
        $group: {
            _id: '$branch._id',
            branch: { $first: '$branch' },
            data: {
                $push: {
                    count: '$count',
                    status: '$_id.status',
                },
            },
        },
    });

    pipeline.push({
        $group: {
            _id: null,
            datasets: { $push: { data: '$data' } },
            labels: { $push: '$branch' },
        },
    });
};
