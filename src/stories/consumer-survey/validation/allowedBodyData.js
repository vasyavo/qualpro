const CONTENT_TYPES = require('./../../../public/js/constants/contentType.js');
const allowedParams = require('./../../../constants/allowedBodyData');

allowedParams[CONTENT_TYPES.CONSUMER_SURVEY] = {
    0: {
        create: [
            'title',
            'dueDate',
            'status',
            'location',
            'country',
            'region',
            'subRegion',
            'retailSegment',
            'outlet',
            'branch',
            'questions'
        ],
        update: [
            'title',
            'dueDate',
            'status',
            'location',
            'country',
            'region',
            'subRegion',
            'retailSegment',
            'outlet',
            'branch',
            'questions'
        ]
    },
    1: {
        create: [
            'title',
            'dueDate',
            'status',
            'location',
            'country',
            'region',
            'subRegion',
            'retailSegment',
            'outlet',
            'branch',
            'questions'
        ],
        update: [
            'title',
            'dueDate',
            'status',
            'location',
            'country',
            'region',
            'subRegion',
            'retailSegment',
            'outlet',
            'branch',
            'questions'
        ]
    },
    2: {
        create: [
            'title',
            'dueDate',
            'status',
            'location',
            'country',
            'region',
            'subRegion',
            'retailSegment',
            'outlet',
            'branch',
            'questions'
        ],
        update: [
            'title',
            'dueDate',
            'status',
            'location',
            'country',
            'region',
            'subRegion',
            'retailSegment',
            'outlet',
            'branch',
            'questions'
        ]
    },
    3: {
        create: [],
        update: []
    },
    4: {
        create: [],
        update: []
    },
    5: {
        create: [],
        update: []
    },
    6: {
        create: [],
        update: []
    },
    7: {
        create: [],
        update: []
    },
    8: {
        create: [
            'title',
            'dueDate',
            'status',
            'location',
            'country',
            'region',
            'subRegion',
            'retailSegment',
            'outlet',
            'branch',
            'questions'
        ],
        update: [
            'title',
            'dueDate',
            'status',
            'location',
            'country',
            'region',
            'subRegion',
            'retailSegment',
            'outlet',
            'branch',
            'questions'
        ]
    },
    9: {
        create: [
            'title',
            'dueDate',
            'status',
            'location',
            'country',
            'region',
            'subRegion',
            'retailSegment',
            'outlet',
            'branch',
            'questions'
        ],
        update: [
            'title',
            'dueDate',
            'status',
            'location',
            'country',
            'region',
            'subRegion',
            'retailSegment',
            'outlet',
            'branch',
            'questions'
        ]
    },
    10: {
        create: [],
        update: []
    }
};

module.exports = allowedParams;
