const _ = require('lodash');
const CONTENT_TYPES = require('./../../../../../public/js/constants/contentType');

module.exports = (pipeline, queryFilter) => {
    pipeline.push(...[
        {
            $project: {
                _id: 1,
                assignee: 1,
            },
        },
        {
            $unwind: {
                path: '$assignee',
            },
        },
    ]);

    if (_.get(queryFilter, `${CONTENT_TYPES.PERSONNEL}.length`)) {
        pipeline.push({
            'assignee._id': {
                $in: queryFilter[CONTENT_TYPES.PERSONNEL],
            },
        });
    }

    pipeline.push(...[
        {
            $group: {
                _id: {
                    promotion: '$_id',
                    assignee: '$assignee._id',
                },
                assignee: { $first: '$assignee' },
            },
        },
        {
            $project: {
                _id: false,
                assignee: 1,
            },
        },
        {
            $group: {
                _id: {
                    assignee: '$assignee._id',
                },
                assignee: { $first: '$assignee' },
                count: { $sum: 1 },
            },
        },
        {
            $project: {
                _id: false,
                assignee: 1,
                count: 1,
            },
        },
        {
            $sort: {
                'assignee.name': 1,
            },
        },
        {
            $group: {
                _id: null,
                data: {
                    $push: {
                        _id: '$assignee._id',
                        name: '$assignee.name',
                        count: '$count',
                    },
                },
                labels: {
                    $push: '$assignee.name',
                },
            },
        },
    ]);
};
