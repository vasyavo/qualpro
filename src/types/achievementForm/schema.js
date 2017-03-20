const Schema = require('mongoose').Schema;
const CONTENT_TYPES = require('./../../public/js/constants/contentType');

const ObjectId = Schema.Types.ObjectId;

const schema = new Schema({
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
    additionalComment: {
        en: {
            type: String,
            default: '',
        },
        ar: {
            type: String,
            default: '',
        },
    },
    startDate: Date,
    endDate: Date,
    personnel: {
        type: ObjectId,
        ref: CONTENT_TYPES.PERSONNEL,
        default: null,
    },
    country: {
        type: ObjectId,
        ref: CONTENT_TYPES.DOMAIN,
        default: null,
    },
    region: {
        type: ObjectId,
        ref: CONTENT_TYPES.DOMAIN,
        default: null,
    },
    subRegion: {
        type: ObjectId,
        ref: CONTENT_TYPES.DOMAIN,
        default: null,
    },
    retailSegment: {
        type: ObjectId,
        ref: CONTENT_TYPES.RETAILSEGMENT,
        default: null,
    },
    outlet: {
        type: ObjectId,
        ref: CONTENT_TYPES.OUTLET,
        default: null,
    },
    branch: {
        type: ObjectId,
        ref: CONTENT_TYPES.BRANCH,
        default: null,
    },
    attachments: {
        type: [{
            type: ObjectId,
            ref: CONTENT_TYPES.FILES,
        }],
        default: [],
    },
    archived: {
        type: Boolean,
        default: false,
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
    collection: `${CONTENT_TYPES.ACHIEVEMENTFORM}s`,
    versionKey: false,
});

module.exports = schema;
