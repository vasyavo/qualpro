'use strict';

const Schema = require('mongoose').Schema;
const ObjectId = Schema.Types.ObjectId;
const CONTENT_TYPES = require('./../../public/js/constants/contentType.js');

const schema = new Schema({
    customer : {
        name : {
            type : String,
            default : null
        },
        nationality : {
            type : String,
            default : null
        },
        gender: {
            type : String,
            default : null
        }
    },
    questionnaryId: { type: ObjectId, ref: CONTENT_TYPES.CONSUMER_SURVEY, require: true },
    questionId: { type: ObjectId, ref: CONTENT_TYPES.CONSUMER_SURVEY, require: true },
    country: { type: ObjectId, ref: CONTENT_TYPES.DOMAIN, default: null },
    region: { type: ObjectId, ref: CONTENT_TYPES.REGION, default: null },
    subRegion: { type: ObjectId, ref: CONTENT_TYPES.SUBREGION, default: null },
    retailSegment: { type: ObjectId, ref: CONTENT_TYPES.RETAILSEGMENT, default: null },
    outlet: { type: ObjectId, ref: CONTENT_TYPES.OUTLET, default: null },
    branch: { type: ObjectId, ref: CONTENT_TYPES.BRANCH, default: null },
    optionIndex: [{ type: Number }],
    text: {
        en: { type: String },
        ar: { type: String }
    },
    createdBy: {
        user: { type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null },
        date: { type: Date, default: new Date() }
    },
    editedBy: {
        user: { type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null },
        date: { type: Date, default: new Date() }
    }
}, { collection: CONTENT_TYPES.CONSUMER_SURVEY_ANSWER });

module.exports = schema;
