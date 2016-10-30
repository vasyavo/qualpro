'use strict';

const Schema = require('mongoose').Schema;
const ObjectId = Schema.Types.ObjectId;
const CONTENT_TYPES = require('./../../public/js/constants/contentType.js');

const schema = new Schema({
    country: { type: ObjectId, ref: CONTENT_TYPES.DOMAIN, default: null },
    outlet: { type: ObjectId, ref: 'outlet' },
    branch: { type: ObjectId, ref: CONTENT_TYPES.BRANCH },
    category: { type: ObjectId, ref: CONTENT_TYPES.CATEGORY, default: null },
    shares: {
        item: { type: ObjectId, ref: CONTENT_TYPES.ITEM },
        distanceInMeters: { type: Number }
    },

    comments: { type: [ObjectId], ref: CONTENT_TYPES.COMMENT },
    isArchived: Boolean,

    creationDate: { type: Date, default: new Date() },
    createdBy: {
        user: { type: ObjectId, ref: CONTENT_TYPES.OUTLET, default: null },
        date: { type: Date, default: new Date() }
    },

    editedBy: {
        user: { type: ObjectId, ref: CONTENT_TYPES.OUTLET, default: null },
        date: { type: Date, default: new Date() }
    }
}, { collection: 'shelves' });

module.exports = schema;
