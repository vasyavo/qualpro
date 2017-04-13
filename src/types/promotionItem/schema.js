const Schema = require('mongoose').Schema;
const CONTENT_TYPES = require('./../../public/js/constants/contentType');
const OTHER_CONSTANTS = require('./../../public/js/constants/otherConstants');

const ObjectId = Schema.Types.ObjectId;
const PROMOTION_STATUSES = OTHER_CONSTANTS.PROMOTION_STATUSES;

const schema = new Schema({
    promotion: {
        type: ObjectId,
        ref: CONTENT_TYPES.PROMOTIONS,
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
    dateStart: {
        type: Date,
    },
    dateEnd: {
        type: Date,
    },
    rsp: {
        type: Number,
        default: 0,
    },
    status: {
        type: String,
        enum: [
            PROMOTION_STATUSES.ACTIVE,
            PROMOTION_STATUSES.EXPIRED,
        ],
        default: PROMOTION_STATUSES.ACTIVE,
    },
    opening: {
        type: [{
            type: Number,
            default: 0,
        }],
        default: [],
    },
    sellIn: {
        type: [{
            type: Number,
            default: 0,
        }],
        default: [],
    },
    closingStock: {
        type: [{
            type: Number,
            default: 0,
        }],
        default: [],
    },
    sellOut: {
        type: [{
            type: Number,
            default: 0,
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
    comment: {
        type: ObjectId,
        ref: CONTENT_TYPES.COMMENT,
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
    collection: `${CONTENT_TYPES.PROMOTIONSITEMS}`,
    versionKey: false,
});

module.exports = schema;
