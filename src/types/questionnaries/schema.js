'use strict';

const Schema = require('mongoose').Schema;
const ObjectId = Schema.Types.ObjectId;
const CONTENT_TYPES = require('./../../public/js/constants/contentType.js');

const schema = new Schema({
    title: {
        en: { type: String, default: '' },
        ar: { type: String, default: '' }
    },
    dueDate: { type: Date, default: new Date() },
    status: { type: String, enum: ['draft', 'active', 'completed'] },
    location: {
        en: { type: String, default: '' },
        ar: { type: String, default: '' }
    },
    country: [{
        type: ObjectId,
        ref: CONTENT_TYPES.DOMAIN
    }],
    region: [{
        type: ObjectId,
        ref: CONTENT_TYPES.DOMAIN
    }],
    subRegion: [{
        type: ObjectId,
        ref: CONTENT_TYPES.DOMAIN
    }],
    retailSegment: [{
        type: ObjectId,
        ref: CONTENT_TYPES.RETAILSEGMENT
    }],
    outlet: [{
        type: ObjectId,
        ref: CONTENT_TYPES.OUTLET
    }],
    branch: [{
        type: ObjectId,
        ref: CONTENT_TYPES.BRANCH
    }],
    personnels: [{
        type: ObjectId,
        ref: CONTENT_TYPES.PERSONNEL
    }],
    countAll: { type: Number, default: 0 },
    countBranches: { type: Number, default: 0 },
    countAnswered: { type: Number, default: 0 },
    questions: [{
        title: {
            en: { type: String, default: '' },
            ar: { type: String, default: '' }
        },
        type: { type: String, enum: ['singleChoice', 'multiChoice', 'fullAnswer'] },
        options: [{
            en: { type: String },
            ar: { type: String }
        }]
    }],
    createdBy: {
        user: { type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null },
        date: { type: Date, default: new Date() }
    },
    editedBy: {
        user: { type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null },
        date: { type: Date, default: new Date() }
    }
}, { collection: CONTENT_TYPES.QUESTIONNARIES });

module.exports = schema;
