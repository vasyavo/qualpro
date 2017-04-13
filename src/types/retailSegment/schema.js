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
    imageSrc: {
        type: ObjectId,
        ref: CONTENT_TYPES.FILES,
        default: () => {
            return defaultPreviews[CONTENT_TYPES.RETAILSEGMENT];
        },
    },
    ID: String,
    archived: {
        type: Boolean,
        default: false,
    },
    topArchived: {
        type: Boolean,
        default: false,
    },
    subRegions: {
        type: [{
            type: ObjectId,
            ref: CONTENT_TYPES.DOMAIN,
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
    configurations: {
        type: [{
            configuration: {
                type: String,
            },
            archived: {
                type: Boolean,
                default: false,
            },
        }],
        default: [],
    },
}, {
    autoIndex: false,
    collection: `${CONTENT_TYPES.RETAILSEGMENT}s`,
    versionKey: false,
});

schema.index({ 'name.en': 1 }, { unique: true });
schema.index({ 'name.ar': 1 }, { unique: true });

module.exports = schema;
