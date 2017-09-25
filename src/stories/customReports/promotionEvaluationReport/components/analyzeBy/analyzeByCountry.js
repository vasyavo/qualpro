module.exports = (pipeline) => {
    pipeline.push(...[
        {
            $project: {
                _id: 1,
                country: 1,
            },
        },
        {
            $group: {
                _id: {
                    promotion: '$_id',
                    country: '$country._id',
                },
                country: { $first: '$country' },
            },
        },
        {
            $project: {
                _id: false,
                country: 1,
            },
        },
        {
            $group: {
                _id: {
                    country: '$country._id',
                },
                country: { $first: '$country' },
                count: { $sum: 1 },
            },
        },
        {
            $project: {
                _id: false,
                country: 1,
                count: 1,
            },
        },
        {
            $sort: {
                'country.name': 1,
            },
        },
        {
            $group: {
                _id: null,
                data: {
                    $push: {
                        _id: '$country._id',
                        name: '$country.name',
                        count: '$count',
                    },
                },
                labels: {
                    $push: '$country.name',
                },
            },
        },
    ]);
};
