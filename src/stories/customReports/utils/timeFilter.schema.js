module.exports = {
    type: 'object',
    properties: {
        timeFrames: {
            type: 'array',
            items: {
                from: {
                    type: 'date',
                },
                to: {
                    type: 'date',
                },
            },
            required: ['from', 'to'],
        },
    },
    required: ['timeFrames'],
};
