const Schema = require('mongoose').Schema;
const CONTENT_TYPES = require('./../../public/js/constants/contentType');

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
    packing: {
        type: String,
        default: '',
    },
    origin: {
        type: [{
            type: ObjectId,
            ref: CONTENT_TYPES.ORIGIN,
        }],
        default: [],
    },
    brand: {
        type: ObjectId,
        ref: CONTENT_TYPES.BRAND,
        required: true,
    },
    variant: {
        type: ObjectId,
        ref: CONTENT_TYPES.COMPETITORVARIANT,
        required: true,
    },
    country: {
        type: ObjectId,
        ref: CONTENT_TYPES.DOMAIN,
        required: true,
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
    collection: `${CONTENT_TYPES.COMPETITORITEM}s`,
    versionKey: false,
});

module.exports = schema;
