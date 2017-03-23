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
    ID: String,
    imageSrc: {
        type: ObjectId,
        ref: CONTENT_TYPES.PREVIEW,
        default: defaultPreviews[CONTENT_TYPES.BRAND],
    },
    ourCompany: {
        type: Boolean,
        default: false,
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
    collection: `${CONTENT_TYPES.BRAND}s`,
    versionKey: false,
});

module.exports = schema;
