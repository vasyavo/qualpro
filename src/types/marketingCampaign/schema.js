const Schema = require('mongoose').Schema;
const CONTENT_TYPES = require('./../../public/js/constants/contentType');
const OTHER_CONSTANTS = require('../../public/js/constants/otherConstants');

const ObjectId = Schema.Types.ObjectId;
const PROMOTION_STATUSES = OTHER_CONSTANTS.PROMOTION_STATUSES;

const schema = new Schema({
    category: {
        type: [{
            type: ObjectId,
            ref: CONTENT_TYPES.CATEGORY,
        }],
        default: [],
    },
    country: {
        type: [{
            type: ObjectId,
            ref: CONTENT_TYPES.DOMAIN,
        }],
        default: [],
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
    personnel: {
        type: [{
            type: ObjectId,
            ref: CONTENT_TYPES.PERSONNEL,
        }],
        default: [],
    },
}, {
    autoIndex: false,
    collection: CONTENT_TYPES.MARKETING_CAMPAIGN,
    versionKey: false,
});

module.exports = schema;
