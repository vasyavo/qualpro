const Schema = require('mongoose').Schema;
const ObjectId = Schema.Types.ObjectId;
const CONTENT_TYPES = require('./../../public/js/constants/contentType.js');

const schema = new Schema({
    title       : {type: String, unique: true, require: true},
    archived    : {type: Boolean, default: false},
    attachments : {type: ObjectId, ref: CONTENT_TYPES.FILES, default: null},
    createdBy   : {
        user: {
            type   : ObjectId,
            ref    : CONTENT_TYPES.PERSONNEL,
            default: null
        },
        date: {
            type   : Date,
            default: new Date()
        }
    },
    editedBy    : {
        user: {
            type   : ObjectId,
            ref    : CONTENT_TYPES.PERSONNEL,
            default: null
        },
        date: {
            type   : Date,
            default: new Date()
        }
    },
    contentType : {type: String, default: null},
    originalName: {type: String, default: null},
    preview     : {type: String, default: null}

}, {collection: 'documents'});

module.exports = schema;
