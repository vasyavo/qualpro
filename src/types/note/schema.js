const Schema = require('mongoose').Schema;
const ObjectId = Schema.Types.ObjectId;
const CONTENT_TYPES = require('./../../public/js/constants/contentType.js');

const schema = new Schema({
    title: { type: String, default: '', require: true },
    theme: { type: String, default: '', require: true },
    description: { type: String, default: '', require: true },
    archived: { type: Boolean, default: false },
    attachments : [{ type: ObjectId, ref: CONTENT_TYPES.FILES, default: null }],
    createdBy: {
        user: { type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null },
        date: { type: Date, default: new Date() }
    },
    editedBy: {
        user: { type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null },
        date: { type: Date, default: new Date() }
    }
}, { collection: 'notes' });

module.exports = schema;
