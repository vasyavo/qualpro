'use strict';

const Schema = require('mongoose').Schema;
const ObjectId = Schema.Types.ObjectId;
const CONTENT_TYPES = require('./../../public/js/constants/contentType.js');
const OTHER_CONSTANTS = require('./../../public/js/constants/otherConstants.js');
const PROMOTION_STATUSES = OTHER_CONSTANTS.PROMOTION_STATUSES;

const schema = new Schema({
    promotion: { type: ObjectId, ref: CONTENT_TYPES.PROMOTIONS, default: null },
    outlet: { type: ObjectId, ref: CONTENT_TYPES.OUTLET, default: null },
    branch: { type: ObjectId, ref: CONTENT_TYPES.BRANCH, default: null },
    dateStart: { type: Date },
    dateEnd: { type: Date },
    rsp: { type: Number, default: 0 },
    status: {
        type: String,
        enum: [PROMOTION_STATUSES.ACTIVE, PROMOTION_STATUSES.EXPIRED],
        default: PROMOTION_STATUSES.ACTIVE
    },
    opening: [{ type: Number, default: 0 }],
    sellIn: [{ type: Number, default: 0 }],
    closingStock: [{ type: Number, default: 0 }],
    sellOut: [{ type: Number, default: 0 }],
    displayType: [{
        type: ObjectId,
        ref: CONTENT_TYPES.DISPLAYTYPE,
        default: null
    }],
    comment: { type: ObjectId, ref: CONTENT_TYPES.COMMENT, default: null },
    createdBy: {
        user: { type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null },
        date: { type: Date, default: new Date() }
    },
    editedBy: {
        user: { type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null },
        date: { type: Date, default: new Date() }
    }
}, { collection: 'promotionsItems' });

module.exports = schema;
