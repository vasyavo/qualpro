const Schema = require('mongoose').Schema;
const CONTENT_TYPES = require('./../../public/js/constants/contentType');

const ObjectId = Schema.Types.ObjectId;

const schema = new Schema({
    brandingAndDisplay: {
        type: ObjectId,
        ref: CONTENT_TYPES.MARKETING_CAMPAIGN,
        default: null,
    },
    branch: [{
        type: ObjectId,
        ref: CONTENT_TYPES.BRANCH,
        default: null,
    }],
    comments: [{
        type: ObjectId,
        ref: CONTENT_TYPES.COMMENT,
        default: null,
    }],
    createdBy: {
        user: {
            type: ObjectId,
            ref: CONTENT_TYPES.PERSONNEL,
            default: null,
        },
        date: {
            type: Date,
            default: Date.now,
        },
    },
    editedBy: {
        user: {
            type: ObjectId,
            ref: CONTENT_TYPES.PERSONNEL,
            default: null,
        },
        date: {
            type: Date,
            default: Date.now,
        },
    },
}, {
    collection: CONTENT_TYPES.MARKETING_CAMPAIGN_ITEM,
});

module.exports = schema;
