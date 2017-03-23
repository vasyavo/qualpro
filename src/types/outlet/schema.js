const Schema = require('mongoose').Schema;
const CONTENT_TYPES = require('./../../public/js/constants/contentType');
const defaultPreviews = require('./../../stories/preview/autoload').defaults;

const ObjectId = Schema.Types.ObjectId;

const schema = new Schema({
    name: {
        en: {
            type: String,
            default: '',
        },
        ar: {
            type: String,
            default: '',
        },
    },
    ID: {
        type: String,
    },
    imageSrc: {
        type: ObjectId,
        ref: CONTENT_TYPES.PREVIEW,
        default: defaultPreviews[CONTENT_TYPES.OUTLET],
    },
    subRegions: {
        type: [{
            type: ObjectId,
            ref: CONTENT_TYPES.DOMAIN,
        }],
        default: [],
    },
    retailSegments: {
        type: [{
            type: ObjectId,
            ref: CONTENT_TYPES.RETAILSEGMENT,
        }],
        default: [],
    },
    archived: {
        type: Boolean,
        default: false,
    },
    topArchived: {
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
    collection: `${CONTENT_TYPES.OUTLET}s`,
    versionKey: false,
});

module.exports = schema;
