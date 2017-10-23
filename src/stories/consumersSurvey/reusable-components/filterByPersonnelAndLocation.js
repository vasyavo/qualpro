module.exports = function (filter, personnelId, isMasterAdmin) {
    const pipeline = [];

    pipeline.push({
        $addFields: {
            personnel: {
                $cond: {
                    if  : {
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
            _id              : null,
            setConsumerSurvey: {
                $push: '$$ROOT',
            },
        },
    });

    const $filterConditions = [
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
    const $locationsFilterConditions = [];

    let $project;

    if (isMasterAdmin) {
        $project = {
            result: {
                $filter: {
                    input: '$setConsumerSurvey',
                    as   : 'consumerSurvey',
                    cond : {
                        $and: [
                            {
                                $and: $locationsFilterConditions,
                            },
                            {
                                $or: [
                                    {
                                        $eq: [
                                            '$$consumerSurvey.createdBy.user',
                                            personnelId,
                                        ],
                                    },
                                    {
                                        $and: $filterConditions,
                                    },
                                ],
                            },
                        ],
                    },
                },
            },
        };
    } else {
        $project = {
            result: {
                $filter: {
                    input: '$setConsumerSurvey',
                    as   : 'consumerSurvey',
                    cond : {
                        $and: [
                            {
                                $and: $locationsFilterConditions,
                            },
                            {
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
                                                            as   : 'personnel',
                                                            cond : {
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
                                        $and: $filterConditions,
                                    },
                                ],
                            },
                        ],
                    },
                },
            },
        };
    }

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
                                $setIntersection: [`$$consumerSurvey.${location}`, filter[location] && filter[location].$in ? filter[location].$in : filter[location]],
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
