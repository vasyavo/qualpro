const Schema = require('mongoose').Schema;
const CONTENT_TYPES = require('./../../public/js/constants/contentType');
const OTHER_CONSTANTS = require('./../../public/js/constants/otherConstants');

const ObjectId = Schema.Types.ObjectId;
const PROMOTION_STATUSES = OTHER_CONSTANTS.PROMOTION_STATUSES;

const schema = new Schema({
    promotionType: {
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
        type: ObjectId,
        ref: CONTENT_TYPES.CATEGORY,
    },
    country: {
        type: ObjectId,
        ref: CONTENT_TYPES.DOMAIN,
        default: null,
    },
    region: {
        type: [{
            type: ObjectId,
            ref: CONTENT_TYPES.DOMAIN,
        }],
        default: [],
    },
    subRegion: {
        type: [{
            type: ObjectId,
            ref: CONTENT_TYPES.DOMAIN,
        }],
        default: [],
    },
    retailSegment: {
        type: [{
            type: ObjectId,
            ref: CONTENT_TYPES.RETAILSEGMENT,
        }],
        default: [],
    },
    outlet: {
        type: [{
            type: ObjectId,
            ref: CONTENT_TYPES.OUTLET,
        }],
        default: [],
    },
    branch: {
        type: [{
            type: ObjectId,
            ref: CONTENT_TYPES.BRANCH,
        }],
        default: [],
    },
    displayType: {
        type: [{
            type: ObjectId,
            ref: CONTENT_TYPES.DISPLAYTYPE,
        }],
        default: [],
    },
    barcode: {
        type: String,
        default: '',
    },
    packing: {
        type: String,
        default: '',
    },
    ppt: {
        type: Number,
        default: 0,
    },
    quantity: {
        type: Number,
        default: 0,
    },
    dateStart: {
        type: Date,
    },
    dateEnd: {
        type: Date,
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
    status: {
        type: String,
        enum: [
            PROMOTION_STATUSES.DRAFT,
            PROMOTION_STATUSES.ACTIVE,
            PROMOTION_STATUSES.EXPIRED,
        ],
        default: PROMOTION_STATUSES.DRAFT,
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
    collection: `${CONTENT_TYPES.PROMOTIONS}`,
    versionKey: false,
});

module.exports = schema;
