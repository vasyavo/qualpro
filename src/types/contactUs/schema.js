const Schema = require('mongoose').Schema;
const CONTENT_TYPES = require('./../../public/js/constants/contentType');

const ObjectId = Schema.Types.ObjectId;

const schema = new Schema({
    description: {
        type: String,
    },
    type: {
        type: String,
    },
    status: {
        type: String,
    },
    comments: {
        type: [{
            type: ObjectId,
            ref: CONTENT_TYPES.COMMENT,
        }],
        default: [],
    },
    attachments: {
        type: [{
            type: ObjectId,
            ref: CONTENT_TYPES.FILES,
        }],
        default: [],
    },
    createdBy: {
        type: ObjectId,
        ref: CONTENT_TYPES.PERSONNEL,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, {
    autoIndex: false,
    collection: CONTENT_TYPES.CONTACT_US,
    versionKey: false,
});

module.exports = schema;
