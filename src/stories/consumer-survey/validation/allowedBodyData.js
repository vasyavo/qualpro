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
        update: []
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
        update: []
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
        update: []
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
        update: []
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
        update: []
    },
    10: {
        create: [],
        update: []
    }
};

allowedParams[CONTENT_TYPES.CONSUMER_SURVEY_ANSWER] = {
    0: {
        create: [
            'surveyId',
            'questionId',
            'customer',
            'answers',
            'country',
            'region',
            'subRegion',
            'retailSegment',
            'outlet',
            'branch',
            'optionIndex',
            'text'
        ],
        update: []
    },
    1: {
        create: [
            'surveyId',
            'questionId',
            'customer',
            'answers',
            'country',
            'region',
            'subRegion',
            'retailSegment',
            'outlet',
            'branch',
            'optionIndex',
            'text'
        ],
        update: []
    },
    2: {
        create: [
            'surveyId',
            'questionId',
            'customer',
            'answers',
            'country',
            'region',
            'subRegion',
            'retailSegment',
            'outlet',
            'branch',
            'optionIndex',
            'text'
        ],
        update: []
    },
    3: {
        create: [
            'surveyId',
            'questionId',
            'customer',
            'answers',
            'country',
            'region',
            'subRegion',
            'retailSegment',
            'outlet',
            'branch',
            'optionIndex',
            'text'
        ],
        update: []
    },
    4: {
        create: [
            'surveyId',
            'questionId',
            'customer',
            'answers',
            'country',
            'region',
            'subRegion',
            'retailSegment',
            'outlet',
            'branch',
            'optionIndex',
            'text'
        ],
        update: []
    },
    5: {
        create: [
            'surveyId',
            'questionId',
            'customer',
            'answers',
            'country',
            'region',
            'subRegion',
            'retailSegment',
            'outlet',
            'branch',
            'optionIndex',
            'text'
        ],
        update: []
    },
    6: {
        create: [
            'surveyId',
            'questionId',
            'customer',
            'answers',
            'country',
            'region',
            'subRegion',
            'retailSegment',
            'outlet',
            'branch',
            'optionIndex',
            'text'
        ],
        update: []
    },
    7: {
        create: [
            'surveyId',
            'questionId',
            'customer',
            'answers',
            'country',
            'region',
            'subRegion',
            'retailSegment',
            'outlet',
            'branch',
            'optionIndex',
            'text'
        ],
        update: []
    },
    8: {
        create: [],
        update: []
    },
    9: {
        create: [],
        update: []
    },
    10: {
        create: [
            'surveyId',
            'questionId',
            'customer',
            'answers',
            'country',
            'region',
            'subRegion',
            'retailSegment',
            'outlet',
            'branch',
            'optionIndex',
            'text'
        ],
        update: []
    }
};

module.exports = allowedParams;
