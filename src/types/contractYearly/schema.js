const Schema = require('mongoose').Schema;
const CONTENT_TYPES = require('./../../public/js/constants/contentType');
const OTHER_CONSTANTS = require('../../public/js/constants/otherConstants');

const ObjectId = Schema.Types.ObjectId;
const PROMOTION_STATUSES = OTHER_CONSTANTS.PROMOTION_STATUSES;

const schema = new Schema({
    type: {
        type: String,
        required: true,
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
    status: {
        type: String,
        enum: [PROMOTION_STATUSES.DRAFT, PROMOTION_STATUSES.ACTIVE, PROMOTION_STATUSES.EXPIRED],
        default: PROMOTION_STATUSES.DRAFT,
    },
    dateStart: {
        type: Date,
        required: true,
    },
    dateEnd: {
        type: Date,
        required: true,
    },
    description: {
        en: {
            type: String,
            default: '',
        },
        ar: {
            type: String,
            default: '',
        }
    },
    documents: {
        type: [{
            type: ObjectId,
            ref: CONTENT_TYPES.DOCUMENTS,
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
}, {
    autoIndex: false,
    collection: CONTENT_TYPES.CONTRACTSYEARLY,
    versionKey: false,
});

module.exports = schema;
