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
            file : {
                type: ObjectId,
                ref: CONTENT_TYPES.FILES,
                default: null
            },
            branch : {
                type: ObjectId,
                ref: CONTENT_TYPES.BRANCH,
                default: null
            }
        }]
    },
    after: {
        description: {
            type: String,
            default: ''
        },
        files: [{
            file : {
                type: ObjectId,
                ref: CONTENT_TYPES.FILES,
                default: null
            },
            branch : {
                type: ObjectId,
                ref: CONTENT_TYPES.BRANCH,
                default: null
            }
        }]
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
