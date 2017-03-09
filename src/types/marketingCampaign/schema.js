const Schema = require('mongoose').Schema;
const CONTENT_TYPES = require('./../../public/js/constants/contentType');
const OTHER_CONSTANTS = require('../../public/js/constants/otherConstants');

const ObjectId = Schema.Types.ObjectId;
const PROMOTION_STATUSES = OTHER_CONSTANTS.PROMOTION_STATUSES;

const schema = new Schema({
    category: [{
        type: ObjectId,
        ref: CONTENT_TYPES.CATEGORY,
    }],
    country: [{
        type: ObjectId,
        ref: CONTENT_TYPES.DOMAIN,
    }],
    region: [{
        type: ObjectId,
        ref: CONTENT_TYPES.DOMAIN,
    }],
    subRegion: [{
        type: ObjectId,
        ref: CONTENT_TYPES.DOMAIN,
    }],
    retailSegment: [{
        type: ObjectId,
        ref: CONTENT_TYPES.RETAILSEGMENT,
    }],
    outlet: [{
        type: ObjectId,
        ref: CONTENT_TYPES.OUTLET,
    }],
    branch: [{
        type: ObjectId,
        ref: CONTENT_TYPES.BRANCH,
    }],
    displayType: [{
        type: ObjectId,
        ref: CONTENT_TYPES.DISPLAYTYPE,
        default: null,
    }],
    dateStart: {
        type: Date,
    },
    dateEnd: {
        type: Date,
    },
    attachments: {
        type: Array,
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
    status: {
        type: String,
        enum: [
            PROMOTION_STATUSES.DRAFT,
            PROMOTION_STATUSES.ACTIVE,
            PROMOTION_STATUSES.EXPIRED,
        ],
        default: PROMOTION_STATUSES.DRAFT,
    },
    personnel: [{
        type: ObjectId,
        ref: CONTENT_TYPES.PERSONNEL,
        default: null,
    }],
}, {
    collection: CONTENT_TYPES.MARKETING_CAMPAIGN,
});

module.exports = schema;
