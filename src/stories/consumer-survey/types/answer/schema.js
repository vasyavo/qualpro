const Schema = require('mongoose').Schema;
const ObjectId = Schema.Types.ObjectId;
const CONTENT_TYPES = require('./../../../../public/js/constants/contentType.js');

const schema = new Schema({
    surveyId: {
        type: ObjectId,
        ref: CONTENT_TYPES.CONSUMER_SURVEY,
        require: true
    },
    questionId: {
        type: ObjectId,
        require: true
    },
    personnelId: {
        type: ObjectId,
        ref: CONTENT_TYPES.PERSONNEL,
        require: true
    },
    customer: {
        type: {
            name: {
                type: String,
                required: true,
            },
            nationality: {
                type: String,
                required: true,
            },
            gender: {
                type: String,
                required: true,
            },
        },
        required: true
    },
    country: {
        type: ObjectId,
        ref: CONTENT_TYPES.DOMAIN,
        default: null
    },
    region: {
        type: ObjectId,
        ref: CONTENT_TYPES.DOMAIN,
        default: null
    },
    subRegion: {
        type: ObjectId,
        ref: CONTENT_TYPES.DOMAIN,
        default: null
    },
    retailSegment: {
        type: ObjectId,
        ref: CONTENT_TYPES.RETAILSEGMENT,
        default: null
    },
    outlet: {
        type: ObjectId,
        ref: CONTENT_TYPES.OUTLET,
        default: null
    },
    branch: {
        type: ObjectId,
        ref: CONTENT_TYPES.BRANCH,
        default: null
    },
    optionIndex: [{
        type: Number
    }],
    text: {
        en: {
            type: String
        },
        ar: {
            type: String
        }
    },
    createdBy: {
        user: {
            type: ObjectId,
            ref: CONTENT_TYPES.PERSONNEL,
            default: null
        },
        date: {
            type: Date,
            default: Date.now
        }
    },
    editedBy: {
        user: {
            type: ObjectId,
            ref: CONTENT_TYPES.PERSONNEL,
            default: null
        },
        date: {
            type: Date,
            default: Date.now
        }
    }
}, {
    autoIndex: false,
    collection: CONTENT_TYPES.CONSUMER_SURVEY_ANSWER
});

module.exports = schema;
