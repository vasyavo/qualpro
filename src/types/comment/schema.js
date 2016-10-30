const Schema = require('mongoose').Schema;
const ObjectId = Schema.Types.ObjectId;
const CONTENT_TYPES = require('./../../public/js/constants/contentType.js');

const schema = new Schema({
    body: { type: String, require: true },
    taskId: { type: ObjectId, default: null },
    attachments: { type: Array, default: [], ref: CONTENT_TYPES.FILES },
    isArchived: { type: Boolean, default: false },
    createdBy: {
        user: { type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null },
        date: { type: Date, default: new Date() }
    },
    editedBy: {
        user: { type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null },
        date: { type: Date, default: new Date() }
    }
}, { collection: 'comments' });

module.exports = schema;
