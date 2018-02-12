const Schema = require('mongoose').Schema;
const CONTENT_TYPES = require('./../../public/js/constants/contentType');

const ObjectId = Schema.Types.ObjectId;

const schema = new Schema({
    categories: {
        type: [{
            type: ObjectId,
            ref: CONTENT_TYPES.CATEGORY,
        }],
        default: [],
    },
    country: {
        type: ObjectId,
        ref: CONTENT_TYPES.COUNTRY,
        required: true,
    },
    region: {
        type: ObjectId,
        ref: CONTENT_TYPES.REGION,
        required: true,
    },
    subRegion: {
        type: ObjectId,
        ref: CONTENT_TYPES.SUBREGION,
        required: true,
    },
    branch: {
        type: ObjectId,
        ref: CONTENT_TYPES.BRANCH,
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
    displayType: {
        type: [{
            type: ObjectId,
            ref: CONTENT_TYPES.DISPLAYTYPE,
            default: null,
        }],
        default: [],
    },
    displaySeason: {
        type: String,
        enum: [
            'Ramadan Display',
            'Non-Ramadan Display'
        ]
    },
    displaySize: {
        type: String,
    },
    dateStart: {
        type: Date,
        required: true,
    },
    dateEnd: {
        type: Date,
        required: true,
    },
    attachments: {
        type: [{
            type: ObjectId,
            ref: CONTENT_TYPES.FILES,
        }],
        default: [],
    },
    comments: {
        type: [{
            type: ObjectId,
            ref: CONTENT_TYPES.COMMENT,
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
        type: ObjectId,
        ref: CONTENT_TYPES.PERSONNEL,
        default: null,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
}, {
    autoIndex: false,
    collection: CONTENT_TYPES.BRANDING_AND_MONTHLY_DISPLAY,
    versionKey: false,
});

module.exports = schema;
