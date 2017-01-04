'use strict';
const Schema = require('mongoose').Schema;
const ObjectId = Schema.Types.ObjectId;
const CONTENT_TYPES = require('./../../public/js/constants/contentType.js');

const schema = new Schema({
    itemName: {
        en: { type: String },
        ar: { type: String }
    },
    country: [{ type: ObjectId, ref: CONTENT_TYPES.DOMAIN }],
    region: [{ type: ObjectId, ref: CONTENT_TYPES.DOMAIN }],
    subRegion: [{ type: ObjectId, ref: CONTENT_TYPES.DOMAIN }],
    branch: [{ type: ObjectId, ref: CONTENT_TYPES.BRANCH }],
    retailSegment: [{ type: ObjectId, ref: CONTENT_TYPES.RETAILSEGMENT }],
    outlet: [{ type: ObjectId, ref: CONTENT_TYPES.OUTLET }],
    assignedTo: [{ type: ObjectId, ref: CONTENT_TYPES.PERSONNEL }],
    itemId: { type: ObjectId },
    itemDetails: { type: String, default: '' },
    itemType: { type: String, default: '' },
    accessRoleLevel: { type: Number },
    module: { type: Number },
    actionType: { type: String, default: '' },
    creationDate: { type: Date, default: Date.now },
    personnels: [{ type: ObjectId, ref: CONTENT_TYPES.PERSONNEL }],
    createdBy: {
        user: { type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null },
        date: { type: Date, default: Date.now }
    }

}, { collection: 'activityLists' });

module.exports = schema;
