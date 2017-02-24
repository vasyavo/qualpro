const Schema = require('mongoose').Schema;
const ObjectId = Schema.Types.ObjectId;
const CONTENT_TYPES = require('./../../public/js/constants/contentType.js');

const schema = new Schema({
    title      : {type: String, require: true},
    archived   : {type: Boolean, default: false},
    deleted    : {type: Boolean, default: false},
    attachment : {type: ObjectId, ref: CONTENT_TYPES.FILES, default: null},
    type       : {type: String, enum: ['file', 'folder']},
    parent     : {type: ObjectId, ref: CONTENT_TYPES.DOCUMENTS, default: null},
    breadcrumbs: [{type: ObjectId, ref: CONTENT_TYPES.DOCUMENTS}],
    
    createdBy: {
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
    editedBy : {
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
}, {collection: 'documents', versionKey: false});

module.exports = schema;
