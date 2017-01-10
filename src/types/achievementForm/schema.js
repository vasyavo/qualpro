'use strict';
const Schema = require('mongoose').Schema;
const ObjectId = Schema.Types.ObjectId;
const CONTENT_TYPES = require('./../../public/js/constants/contentType.js');

const schema = new Schema({
    description: {
        en: { type: String, default: '' },
        ar: { type: String, default: '' }
    },
    additionalComment: {
        en: { type: String, default: '' },
        ar: { type: String, default: '' }
    },
    startDate : Date,
    endDate : Date,
    personnel: { type: ObjectId, ref: CONTENT_TYPES.PERSONNEL },
    country: { type: ObjectId, ref: CONTENT_TYPES.DOMAIN },
    region: { type: ObjectId, ref: CONTENT_TYPES.DOMAIN },
    subRegion: { type: ObjectId, ref: CONTENT_TYPES.DOMAIN },
    retailSegment: { type: ObjectId, ref: CONTENT_TYPES.RETAILSEGMENT },
    outlet: { type: ObjectId, ref: CONTENT_TYPES.OUTLET },
    branch: { type: ObjectId, ref: CONTENT_TYPES.BRANCH },
    attachments: { type: Array, default: [] },
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
}, { collection: 'achievementForms' });

module.exports = schema;
