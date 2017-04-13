const Schema = require('mongoose').Schema;
const CONTENT_TYPES = require('./../../public/js/constants/contentType');

const ObjectId = Schema.Types.ObjectId;

const branchData = new Schema({
    branch: {
        type: ObjectId,
        ref: CONTENT_TYPES.BRANCH,
        required: true,
    },
    indicator: {
        type: String,
        enum: ['y', 'n'],
    },
}, {
    _id: false,
});

const itemData = new Schema({
    category: {
        type: ObjectId,
        ref: CONTENT_TYPES.CATEGORY,
        required: true,
    },
    variant: {
        type: ObjectId,
        ref: CONTENT_TYPES.VARIANT,
        required: true,
    },
    item: {
        type: ObjectId,
        ref: CONTENT_TYPES.ITEM,
        required: true,
    },
    branches: [branchData],
}, {
    _id: false,
});

const schema = new Schema({
    objective: {
        type: ObjectId,
        ref: CONTENT_TYPES.OBJECTIVES,
        required: true,
    },
    branches: {
        type: [{
            type: ObjectId,
            ref: CONTENT_TYPES.BRANCH,
        }],
        default: [],
    },
    items: [itemData],
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
    collection: `${CONTENT_TYPES.DISTRIBUTIONFORM}s`,
    versionKey: false,
});

module.exports = schema;
