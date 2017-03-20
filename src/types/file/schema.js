const Schema = require('mongoose').Schema;
const CONTENT_TYPES = require('./../../public/js/constants/contentType');

const ObjectId = Schema.Types.ObjectId;

const schema = new Schema({
    name: {
        type: String,
        default: null,
    },
    originalName: {
        type: String,
        default: null,
    },
    extension: {
        type: String,
        default: null,
    },
    contentType: {
        type: String,
        default: null,
    },
    preview: {
        type: String,
        default: null,
    },
    isProcessing: {
        type: Boolean,
        required: true,
        default: true,
    },
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
        },
    },
}, {
    autoIndex: false,
    collection: CONTENT_TYPES.FILES,
});

module.exports = schema;
