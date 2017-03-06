'use strict';
const Schema = require('mongoose').Schema;
const CONTENT_TYPES = require('./../../public/js/constants/contentType');

const ObjectId = Schema.Types.ObjectId;

const schema = new Schema({
    categories: [{
        type: ObjectId,
        ref: CONTENT_TYPES.CATEGORY,
    }],
    country: {
        type: ObjectId,
        ref: CONTENT_TYPES.COUNTRY,
    },
    region: {
        type: ObjectId,
        ref: CONTENT_TYPES.REGION,
    },
    subRegion: {
        type: ObjectId,
        ref: CONTENT_TYPES.SUBREGION,
    },
    branch: {
        type: ObjectId,
        ref: CONTENT_TYPES.BRANCH,
    },
    retailSegment: {
        type: ObjectId,
        ref: CONTENT_TYPES.RETAILSEGMENT,
    },
    outlet: {
        type: ObjectId,
        ref: CONTENT_TYPES.OUTLET,
    },
    displayType: [{
        type: ObjectId,
        ref: CONTENT_TYPES.DISPLAYTYPE,
        default: null,
    }],
    dateStart: {
        type: Date,
    },
    dateEnd: {
        type: Date,
    },
    attachments: { type: Array, default: [] },
    comments: {
        type: Array,
        default: [],
    },
    description: {
        en: { type: String, default: '' },
        ar: { type: String, default: '' },
    },
    createdBy: {
        type: ObjectId,
        ref: CONTENT_TYPES.PERSONNEL,
        default: null,
    },
    createdAt: {
        type: Date,
        default: new Date(),
    },
    updatedAt: {
        type: Date,
        default: new Date(),
    },
}, {
    collection: CONTENT_TYPES.BRANDING_AND_DISPLAY,
});

module.exports = schema;
