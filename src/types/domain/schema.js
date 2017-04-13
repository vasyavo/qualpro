const Schema = require('mongoose').Schema;
const CONTENT_TYPES = require('./../../public/js/constants/contentType');
const defaultPreviews = require('./../../stories/preview/autoload').defaults;

const ObjectId = Schema.Types.ObjectId;

const schema = new Schema({
    name: {
        en: {
            type: String,
        },
        ar: {
            type: String,
        },
    },
    ID: {
        type: String,
    },
    imageSrc: {
        type: ObjectId,
        ref: CONTENT_TYPES.PREVIEW,
        default: () => {
            return defaultPreviews[CONTENT_TYPES.DOMAIN];
        },
    },
    currency: {
        type: String,
        ref: CONTENT_TYPES.CURRENCY,
        default: null,
    },
    archived: {
        type: Boolean,
        default: false,
    },
    topArchived: {
        type: Boolean,
        default: false,
    },
    type: {
        type: String,
        enum: ['country', 'region', 'subRegion'],
        required: true,
    },
    parent: {
        type: ObjectId,
        ref: CONTENT_TYPES.DOMAIN,
        default: null,
    },
    xlsParent: {
        type: Number,
        default: null,
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
    collection: `${CONTENT_TYPES.DOMAIN}s`,
    versionKey: false,
});

module.exports = schema;
