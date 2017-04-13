const Schema = require('mongoose').Schema;
const CONTENT_TYPES = require('./../../public/js/constants/contentType');

const ObjectId = Schema.Types.ObjectId;

const branchSchema = new Schema({
    branchId: {
        type: ObjectId,
        ref: CONTENT_TYPES.BRANCH,
        required: true,
    },
    before: {
        files: [{
            type: ObjectId,
            ref: CONTENT_TYPES.FILES,
        }],
        default: [],
    },
    after: {
        description: {
            type: String,
            default: '',
        },
        files: [{
            type: ObjectId,
            ref: CONTENT_TYPES.FILES,
        }],
        default: [],
    },
}, {
    versionKey: false,
    _id: false,
});

const schema = new Schema({
    objective: {
        type: ObjectId,
        ref: CONTENT_TYPES.OBJECTIVES,
        required: true,
    },
    branches: [branchSchema],
    before: {
        files: {
            type: [{
                type: ObjectId,
                ref: CONTENT_TYPES.FILES,
            }],
            default: [],
        },
    },
    after: {
        description: {
            type: String,
            default: '',
        },
        files: {
            type: [{
                type: ObjectId,
                ref: CONTENT_TYPES.FILES,
            }],
            default: [],
        },
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
    collection: `${CONTENT_TYPES.VISIBILITYFORM}s`,
    versionKey: false,
});

module.exports = schema;
