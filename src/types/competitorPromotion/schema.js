'use strict';
const Schema = require('mongoose').Schema;
const ObjectId = Schema.Types.ObjectId;
const CONTENT_TYPES = require('./../../public/js/constants/contentType.js');

const schema = new Schema({
    description: {
        en: { type: String, default: '' },
        ar: { type: String, default: '' }
    },
    category: [{ type: ObjectId, ref: CONTENT_TYPES.CATEGORY, default: null, require: true }],
    brand: { type: ObjectId, ref: CONTENT_TYPES.BRAND, require: true },
    country: { type: ObjectId, ref: CONTENT_TYPES.DOMAIN, require: true },
    region: { type: ObjectId, ref: CONTENT_TYPES.DOMAIN, require: true },
    subRegion: { type: ObjectId, ref: CONTENT_TYPES.DOMAIN, require: true },
    retailSegment: { type: ObjectId, ref: CONTENT_TYPES.RETAILSEGMENT, require: true },
    outlet: { type: ObjectId, ref: CONTENT_TYPES.OUTLET, require: true },
    branch: { type: ObjectId, ref: CONTENT_TYPES.BRANCH, require: true },
    origin: [{ type: ObjectId, ref: CONTENT_TYPES.ORIGIN }],
    promotion: { type: String, default: '', require: true },
    price: { type: String, default: '', require: true },
    packing: { type: String, default: '', require: true },
    packingType: { type: String, enum: ['gm', 'ml', ''], default: ''},
    expiry: { type: Date },
    displayType: [{
        type: ObjectId,
        ref: CONTENT_TYPES.DISPLAYTYPE,
        default: null
    }],
    dateStart: { type: Date },
    dateEnd: { type: Date },
    comments: [{ type: ObjectId, ref: CONTENT_TYPES.COMMENT, default: null }],
    attachments: { type: Array, default: [], require: true },
    archived: {
        type: Boolean,
        default: false
    },
    createdBy: {
        user: { type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null },
        date: {
            type: Date,
            default: new Date()
        }
    },
    editedBy: {
        user: { type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null },
        date: {
            type: Date,
            default: new Date()
        }
    }
}, { collection: 'competitorPromotion' });

module.exports = schema;
