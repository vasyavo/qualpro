const Schema = require('mongoose').Schema;
const ObjectId = Schema.Types.ObjectId;
const CONTENT_TYPES = require('./../../public/js/constants/contentType.js');

const schema = new Schema({
    brandingAndDisplay: { type: ObjectId, ref: CONTENT_TYPES.BRANDINGANDDISPLAY, default: null },
    branch: [{ type: ObjectId, ref: CONTENT_TYPES.BRANCH, default: null }],
    comments: [{ type: ObjectId, ref: CONTENT_TYPES.COMMENT, default: null }],
    createdBy: {
        user: { type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null },
        date: { type: Date, default: new Date() }
    },
    editedBy: {
        user: { type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null },
        date: { type: Date }
    }
}, { collection: 'brandingAndDisplayItems' });

module.exports = schema;
