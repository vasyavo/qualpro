'use strict';

const Schema = require('mongoose').Schema;
const ObjectId = Schema.Types.ObjectId;
const CONTENT_TYPES = require('./../../public/js/constants/contentType.js');

const schema = new Schema({
    country: { type: ObjectId, ref: CONTENT_TYPES.COUNTRY, default: null, required: true },
    region: { type: ObjectId, ref: CONTENT_TYPES.REGION, default: null, required: true },
    subRegion: { type: ObjectId, ref: CONTENT_TYPES.SUBREGION, default: null, required: true },
    retailSegment: { type: ObjectId, ref: CONTENT_TYPES.RETAILSEGMENT, default: null, required: true },
    outlet: { type: ObjectId, ref: CONTENT_TYPES.OUTLET, default: null, required: true },
    branch: { type: ObjectId, ref: CONTENT_TYPES.BRANCH, default: null, required: true },
    category: { type: ObjectId, ref: CONTENT_TYPES.CATEGORY, default: null, required: true },
    brands: [{
        brand: { type: ObjectId, ref: CONTENT_TYPES.BRAND, default: null, required: true },
        length: { type: Number, required: true },
        percent: { type: Number, required: true }
    }],

    totalBrandsLength: { type: Number, required: true },
    createdBy: {
        user: { type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null },
        date: { type: Date, default: new Date() }
    },

    editedBy: {
        user: { type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null },
        date: { type: Date, default: new Date() }
    }
}, { collection: CONTENT_TYPES.SHELFSHARES });

module.exports = schema;
