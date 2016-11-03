const Schema = require('mongoose').Schema;
const ObjectId = Schema.Types.ObjectId;
const CONTENT_TYPES = require('./../../public/js/constants/contentType.js');

const schema = new Schema({
    objective: {
        type: ObjectId,
        ref: CONTENT_TYPES.OBJECTIVES,
        required: true
    },
    before: {
        files: [{
            type: ObjectId,
            ref: CONTENT_TYPES.FILES,
            default: null
        }]
    },
    after: {
        files: [{
            type: ObjectId,
            ref: CONTENT_TYPES.FILES,
            default: null
        }],
        description: {
            type: String,
            default: ''
        }
    },
    createdBy: {
        user: {
            type: ObjectId,
            ref: CONTENT_TYPES.PERSONNEL,
            default: null
        },
        date: {
            type: Date,
            default: new Date()
        }
    },
    editedBy: {
        user: {
            type: ObjectId,
            ef: CONTENT_TYPES.PERSONNEL,
            default: null
        },
        date: {
            type: Date,
            default: new Date()
        }
    }
}, {
    collection: 'visibilityForms',
    versionKey: false
});

module.exports = schema;