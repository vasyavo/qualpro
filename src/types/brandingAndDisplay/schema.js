'use strict';
const Schema = require('mongoose').Schema;
const ObjectId = Schema.Types.ObjectId;
const CONTENT_TYPES = require('./../../public/js/constants/contentType.js');

const schema = new Schema({
    categories: [{
        type: ObjectId,
        ref: CONTENT_TYPES.CATEGORY
    }],
    outlet: {
        type: ObjectId,
        ref: CONTENT_TYPES.OUTLET
    },
    branch: {
        type: ObjectId,
        ref: CONTENT_TYPES.BRANCH
    },
    displayType: {
        type: Number,
        ref: CONTENT_TYPES.DISPLAYTYPE,
        default: 16
    },
    dateStart: {
        type: Date
    },
    dateEnd: {
        type: Date
    },
    attachments: { type: Array, default: [] },
    comments : {
        type : Array,
        default : []
    },
    description: {
        en: { type: String, default: '' },
        ar: { type: String, default: '' }
    },
    createdBy: {
        type: ObjectId,
        ref: CONTENT_TYPES.PERSONNEL,
        default: null
    },
    createdAt : {
        type: Date,
        default: new Date()
    },
    updatedAt : {
        type: Date,
        default: new Date()
    }
}, {
    collection: CONTENT_TYPES.BRANDING_AND_DISPLAY
});

module.exports = schema;
