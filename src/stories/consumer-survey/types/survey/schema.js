const Schema = require('mongoose').Schema;
const ObjectId = Schema.Types.ObjectId;
const CONTENT_TYPES = require('./../../../../public/js/constants/contentType.js');

const QuestionSchema = require('././schema');

const schema = new Schema({
    title: {
        en: {
            type: String,
            default: ''
        },
        ar: {
            type: String,
            default: ''
        }
    },
    dueDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['draft', 'active', 'completed']
    },
    location: {
        en: {
            type: String,
            default: ''
        },
        ar: {
            type: String,
            default: ''
        }
    },
    country: [{
        type: ObjectId,
        ref: CONTENT_TYPES.DOMAIN
    }],
    region: [{
        type: ObjectId,
        ref: CONTENT_TYPES.DOMAIN
    }],
    subRegion: [{
        type: ObjectId,
        ref: CONTENT_TYPES.DOMAIN
    }],
    retailSegment: [{
        type: ObjectId,
        ref: CONTENT_TYPES.RETAILSEGMENT
    }],
    outlet: [{
        type: ObjectId,
        ref: CONTENT_TYPES.OUTLET
    }],
    branch: [{
        type: ObjectId,
        ref: CONTENT_TYPES.BRANCH
    }],
    questions: [QuestionSchema],
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
    collection: CONTENT_TYPES.CONSUMER_SURVEY
});

module.exports = schema;
