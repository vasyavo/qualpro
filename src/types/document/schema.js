const Schema = require('mongoose').Schema;
const CONTENT_TYPES = require('./../../public/js/constants/contentType');

const ObjectId = Schema.Types.ObjectId;

const schema = new Schema({
    title: {
        type: String,
        required: true,
    },
    archived: {
        type: Boolean,
        default: false,
    },
    deleted: {
        type: Boolean,
        default: false,
    },
    attachment: {
        type: ObjectId,
        ref: CONTENT_TYPES.FILES,
        default: null,
    },
    type: {
        type: String,
        enum: ['file', 'folder'],
    },
    parent: {
        type: ObjectId,
        ref: CONTENT_TYPES.DOCUMENTS,
        default: null,
    },
    breadcrumbs: {
        type: [{
            type: ObjectId,
            ref: CONTENT_TYPES.DOCUMENTS,
        }],
        default: [],
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
            default: Date.now,
        },
    },
}, {
    autoIndex: false,
    collection: CONTENT_TYPES.DOCUMENTS,
    versionKey: false,
});

module.exports = schema;
