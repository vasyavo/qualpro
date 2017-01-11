const Schema = require('mongoose').Schema;
const ObjectId = Schema.Types.ObjectId;
const CONTENT_TYPES = require('./../../public/js/constants/contentType.js');

const branchSchema = new Schema({
    branchId: {
        type    : ObjectId,
        ref     : CONTENT_TYPES.BRANCH,
        required: true
    },

    before: {
        files: [{
            type   : ObjectId,
            ref    : CONTENT_TYPES.FILES,
            default: null
        }]
    },

    after: {
        description: {
            type   : String,
            default: ''
        },

        files: [{
            type   : ObjectId,
            ref    : CONTENT_TYPES.FILES,
            default: null
        }]
    }
}, {
    versionKey: false,
    _id       : false
});

const schema = new Schema({
    objective: {
        type    : ObjectId,
        ref     : CONTENT_TYPES.OBJECTIVES,
        required: true
    },

    branches: [branchSchema],

    before: {
        files: [{
            type   : ObjectId,
            ref    : CONTENT_TYPES.FILES,
            default: null
        }]
    },

    after: {
        description: {
            type   : String,
            default: ''
        },
        files      : [{
            type   : ObjectId,
            ref    : CONTENT_TYPES.FILES,
            default: null
        }]
    },

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

    editedBy: {
        user: {
            type   : ObjectId,
            ref     : CONTENT_TYPES.PERSONNEL,
            default: null
        },
        date: {
            type   : Date,
            default: new Date()
        }
    }
}, {
    collection: 'visibilityForms',
    versionKey: false
});

module.exports = schema;
