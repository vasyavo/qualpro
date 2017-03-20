const Schema = require('mongoose').Schema;
const CONTENT_TYPES = require('./../../public/js/constants/contentType');

const ObjectId = Schema.Types.ObjectId;

const schema = new Schema({
    country: {
        type: [{
            type: ObjectId,
            ref: CONTENT_TYPES.COUNTRY,
        }],
        default: [],
    },
    region: {
        type: [{
            type: ObjectId,
            ref: CONTENT_TYPES.REGION,
        }],
        default: [],
    },
    subRegion: {
        type: [{
            type: ObjectId,
            ref: CONTENT_TYPES.SUBREGION,
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
    position: {
        type: [{
            type: ObjectId,
            ref: CONTENT_TYPES.POSITION,
        }],
        default: [],
    },
    recipients: {
        type: [{
            type: ObjectId,
            ref: CONTENT_TYPES.PERSONNEL,
        }],
        default: [],
    },
    attachments: {
        type: [{
            type: ObjectId,
            ref: CONTENT_TYPES.FILES,
        }],
        default: [],
    },
    description: {
        en: {
            type: String,
            default: '',
        },
        ar: {
            type: String,
            default: '',
        },
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
}, {
    autoIndex: false,
    collection: CONTENT_TYPES.NOTIFICATIONS,
    versionKey: false,
});

module.exports = schema;
