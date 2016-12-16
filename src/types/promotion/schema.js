'use strict';

const Schema = require('mongoose').Schema;
const ObjectId = Schema.Types.ObjectId;
const CONTENT_TYPES = require('./../../public/js/constants/contentType.js');
const OTHER_CONSTANTS = require('./../../public/js/constants/otherConstants.js');
const PROMOTION_STATUSES = OTHER_CONSTANTS.PROMOTION_STATUSES;

const schema = new Schema({
    promotionType: {
        en: { type: String, default: '' },
        ar: { type: String, default: '' }
    },

    category: { type: ObjectId, ref: CONTENT_TYPES.CATEGORY },
    country: { type: ObjectId, ref: CONTENT_TYPES.DOMAIN, default: null },
    region: [{ type: ObjectId, ref: CONTENT_TYPES.DOMAIN, default: null }],
    subRegion: [{ type: ObjectId, ref: CONTENT_TYPES.DOMAIN, default: null }],
    retailSegment: [{ type: ObjectId, ref: CONTENT_TYPES.RETAILSEGMENT, default: null }],
    outlet: [{ type: ObjectId, ref: CONTENT_TYPES.OUTLET, default: null }],
    branch: [{ type: ObjectId, ref: CONTENT_TYPES.BRANCH, default: null }],
    displayType: [{
        type: ObjectId,
        ref: CONTENT_TYPES.DISPLAYTYPE,
        default: null
    }],
    barcode: { type: String, default: '' },
    packing: { type: String, default: '' },
    ppt: { type: Number, default: 0 },
    quantity: { type: Number, default: 0 },
    dateStart: { type: Date },
    dateEnd: { type: Date },
    attachments: { type: Array, default: [] },
    comments: [{ type: ObjectId, ref: CONTENT_TYPES.COMMENT, default: null }],
    status: {
        type: String,
        enum: [PROMOTION_STATUSES.DRAFT, PROMOTION_STATUSES.ACTIVE, PROMOTION_STATUSES.EXPIRED],
        default: PROMOTION_STATUSES.DRAFT
    },

    createdBy: {
        user: { type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null },
        date: { type: Date, default: new Date() }
    },

    editedBy: {
        user: { type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null },
        date: { type: Date, default: new Date() }
    }
}, { collection: 'promotions' });

module.exports = schema;
