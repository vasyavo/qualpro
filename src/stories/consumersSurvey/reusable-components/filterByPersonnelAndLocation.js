module.exports = function (filter, personnelId) {
    const pipeline = [];

    pipeline.push({
        $addFields: {
            personnel: {
                $cond: {
                    if: {
                        $ifNull: ['$personnel', false],
                    },
                    then: '$personnel',
                    else: [],
                },
            },
        },
    });

    pipeline.push({
        $group: {
            _id: null,
            setConsumerSurvey: {
                $push: '$$ROOT',
            },
        },
    });

    const $locationsFilterConditions = [
        {
            $ne: [
                '$$consumerSurvey.createdBy.user',
                personnelId,
            ],
        },
        {
            $eq: [
                {
                    $size: '$$consumerSurvey.personnel',
                },
                0,
            ],
        },
    ];

    const $project = {
        result: {
            $filter: {
                input: '$setConsumerSurvey',
                as: 'consumerSurvey',
                cond: {
                    $or: [
                        {
                            $eq: [
                                '$$consumerSurvey.createdBy.user',
                                personnelId,
                            ],
                        },
                        {
                            $and: [
                                {
                                    $ne: [
                                        '$$consumerSurvey.createdBy.user',
                                        personnelId,
                                    ],
                                },
                                {
                                    $ne: [
                                        {
                                            $filter: {
                                                input: '$$consumerSurvey.personnel',
                                                as: 'personnel',
                                                cond: {
                                                    $eq: [
                                                        '$$personnel',
                                                        personnelId,
                                                    ],
                                                },
                                            },
                                        },
                                        [],
                                    ],
                                },
                            ],
                        },
                        {
                            $and: $locationsFilterConditions,
                        },
                    ],
                },
            },
        },
    };

    const locations = ['country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch'];

    locations.forEach((location) => {
        if (filter[location]) {
            $locationsFilterConditions.push({
                $or: [
                    {
                        $eq: [`$$consumerSurvey.${location}`, null],
                    },
                    {
                        $ne: [
                            {
                                $setIntersection: [`$$consumerSurvey.${location}`, filter[location]],
                            },
                            [],
                        ],
                    },
                ],
            });
        }
    });

    pipeline.push({
        $project,
    });

    pipeline.push({
        $unwind: '$result',
    });

    pipeline.push({
        $replaceRoot: {
            newRoot: '$result',
        },
    });

    return pipeline;
};
