const Schema = require('mongoose').Schema;
const CONTENT_TYPES = require('./../../public/js/constants/contentType');

const ObjectId = Schema.Types.ObjectId;

const schema = new Schema({
    category: {
        type: ObjectId,
        ref: CONTENT_TYPES.CATEGORY,
        default: null,
    },
    variant: {
        type: ObjectId,
        ref: CONTENT_TYPES.COMPETITORVARIANT,
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
    items: {
        type: [{
            _id: false,
            brand: {
                type: ObjectId,
                ref: CONTENT_TYPES.BRAND,
            },
            size: {
                type: String,
            },
            price: {
                type: Number,
                min: 0,
                default: 0,
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
}, {
    autoIndex: false,
    collection: `${CONTENT_TYPES.PRICESURVEY}s`,
    versionKey: false,
});

module.exports = schema;
