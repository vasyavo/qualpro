module.exports = (pipeline) => {
    pipeline.push({
        $lookup: {
            from: 'personnels',
            localField: 'assignedTo',
            foreignField: '_id',
            as: 'assignedTo',
        },
    });

    pipeline.push({
        $unwind: '$assignedTo',
    });

    pipeline.push({
        $group: {
            _id: {
                assigneePosition: '$assignedTo.position',
                status: '$status',
            },
            count: { $sum: 1 },
        },
    });

    pipeline.push({
        $lookup: {
            from: 'positions',
            localField: '_id.assigneePosition',
            foreignField: '_id',
            as: 'assigneePosition',
        },
    });

    pipeline.push({
        $project: {
            count: 1,
            assigneePosition: {
                $let: {
                    vars: {
                        assigneePosition: { $arrayElemAt: ['$assigneePosition', 0] },
                    },
                    in: {
                        _id: '$$assigneePosition._id',
                        name: '$$assigneePosition.name',
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
            _id: '$assigneePosition._id',
            assigneePosition: { $first: '$assigneePosition' },
            data: {
                $push: {
                    count: '$count',
                    status: '$_id.status',
                },
            },
            total: { $sum: '$count' },
        },
    });

    pipeline.push({
        $addFields: {
            data: {
                $concatArrays: [
                    '$data',
                    [{
                        count: '$total',
                        status: 'total',
                    }],
                ],
            },
        },
    });

    pipeline.push({
        $group: {
            _id: null,
            data: { $push: '$data' },
            labels: { $push: '$assigneePosition' },
        },
    });

    pipeline.push({
        $project: {
            datasets: [{ data: '$data' }],
            labels: 1,
        },
    });
};
