const Schema = require('mongoose').Schema;
const CONTENT_TYPES = require('./../../public/js/constants/contentType');

const ObjectId = Schema.Types.ObjectId;

const schema = new Schema({
    country: {
        type: ObjectId,
        ref: CONTENT_TYPES.COUNTRY,
        default: null,
    },
    region: {
        type: ObjectId,
        ref: CONTENT_TYPES.REGION,
        default: null,
    },
    subRegion: {
        type: ObjectId,
        ref: CONTENT_TYPES.SUBREGION,
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
    category: {
        type: ObjectId,
        ref: CONTENT_TYPES.CATEGORY,
        default: null,
    },
    brands: {
        type: [{
            brand: {
                type: ObjectId,
                ref: CONTENT_TYPES.BRAND,
                default: null,
            },
            length: {
                type: Number,
                required: true,
            },
            percent: {
                type: Number,
                required: true,
            },
        }],
        default: [],
    },
    totalBrandsLength: {
        type: Number,
        required: true,
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
    collection: CONTENT_TYPES.SHELFSHARES,
    versionKey: false,
});

module.exports = schema;
