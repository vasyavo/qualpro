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
    category: {
        type: [{
            type: ObjectId,
            ref: CONTENT_TYPES.CATEGORY,
        }],
        default: [],
    },
    brand: {
        type: ObjectId,
        ref: CONTENT_TYPES.BRAND,
        required: true,
    },
    country: {
        type: ObjectId,
        ref: CONTENT_TYPES.DOMAIN,
        required: true,
    },
    region: {
        type: ObjectId,
        ref: CONTENT_TYPES.DOMAIN,
        required: true,
    },
    subRegion: {
        type: ObjectId,
        ref: CONTENT_TYPES.DOMAIN,
        required: true,
    },
    retailSegment: {
        type: ObjectId,
        ref: CONTENT_TYPES.RETAILSEGMENT,
        required: true,
    },
    outlet: {
        type: ObjectId,
        ref: CONTENT_TYPES.OUTLET,
        required: true,
    },
    branch: {
        type: ObjectId,
        ref: CONTENT_TYPES.BRANCH,
        required: true,
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
    displayType: {
        type: [{
            type: ObjectId,
            ref: CONTENT_TYPES.DISPLAYTYPE,
            default: null,
        }],
        default: [],
    },
    dateStart: {
        type: Date,
    },
    dateEnd: {
        type: Date,
    },
    comments: {
        type: [{
            type: ObjectId,
            ref: CONTENT_TYPES.COMMENT,
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
    collection: CONTENT_TYPES.COMPETITORBRANDING,
    versionKey: false,
});

module.exports = schema;
