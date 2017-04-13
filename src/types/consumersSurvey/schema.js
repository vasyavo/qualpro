const Schema = require('mongoose').Schema;
const CONTENT_TYPES = require('./../../public/js/constants/contentType');

const ObjectId = Schema.Types.ObjectId;

const schema = new Schema({
    title: {
        en: {
            type: String,
            default: '',
        },
        ar: {
            type: String,
            default: '',
        },
    },
    dueDate: {
        type: Date,
        required: true,
    },
    startDate: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        enum: ['draft', 'active', 'completed'],
    },
    personnel: {
        type: [{
            type: ObjectId,
            ref: CONTENT_TYPES.PERSONNEL,
        }],
        default: [],
    },
    location: {
        en: {
            type: String,
            default: '',
        },
        ar: {
            type: String,
            default: '',
        },
    },
    country: {
        type: [{
            type: ObjectId,
            ref: CONTENT_TYPES.DOMAIN,
        }],
        default: [],
    },
    region: {
        type: [{
            type: ObjectId,
            ref: CONTENT_TYPES.DOMAIN,
        }],
        default: [],
    },
    subRegion: {
        type: [{
            type: ObjectId,
            ref: CONTENT_TYPES.DOMAIN,
        }],
        default: [],
    },
    retailSegment: {
        type: [{
            type: ObjectId,
            ref: CONTENT_TYPES.RETAILSEGMENT,
        }],
        default: [],
    },
    outlet: {
        type: [{
            type: ObjectId,
            ref: CONTENT_TYPES.OUTLET,
        }],
        default: [],
    },
    branch: {
        type: [{
            type: ObjectId,
            ref: CONTENT_TYPES.BRANCH,
        }],
        default: [],
    },
    countAnswered: {
        type: Number,
        default: 0,
    },
    questions: {
        type: [{
            title: {
                en: {
                    type: String,
                    default: '',
                },
                ar: {
                    type: String,
                    default: '',
                },
            },
            type: {
                type: String,
                enum: ['singleChoice', 'multiChoice', 'fullAnswer', 'NPS'],
            },
            options: {
                type: [{
                    en: {
                        type: String,
                    },
                    ar: {
                        type: String,
                    },
                }],
                default: [],
            },
        }],
        default: [],
    },
    createdBy: {
        user: {
            type: ObjectId,
            ref: CONTENT_TYPES.PERSONNEL,
            default: null,
        },
        date: {
            type: Date,
            default: Date.now,
        },
    },
    editedBy: {
        user: {
            type: ObjectId,
            ref: CONTENT_TYPES.PERSONNEL,
            default: null,
        },
        date: {
            type: Date,
            default: Date.now,
        },
    },
}, {
    autoIndex: false,
    collection: CONTENT_TYPES.CONSUMER_SURVEY,
    versionKey: false,
});

module.exports = schema;
