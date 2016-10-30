const Schema = require('mongoose').Schema;
const ObjectId = Schema.Types.ObjectId;
const CONTENT_TYPES = require('./../../public/js/constants/contentType.js');

const branchData = new Schema({
    // outlet   : {type: ObjectId, ref: CONTENT_TYPES.OUTLET, required: true},
    branch: { type: ObjectId, ref: CONTENT_TYPES.BRANCH, required: true },
    indicator: { type: String, enum: ['y', 'n'] }
}, { _id: false });

const itemData = new Schema({
    category: { type: ObjectId, ref: CONTENT_TYPES.CATEGORY, required: true },
    variant: { type: ObjectId, ref: CONTENT_TYPES.VARIANT, required: true },
    item: { type: ObjectId, ref: CONTENT_TYPES.ITEM, required: true },
    branches: [branchData]
}, { _id: false });

const schema = new Schema({
    objective: { type: ObjectId, ref: CONTENT_TYPES.OBJECTIVES, required: true },
    branches: [{ type: ObjectId, ref: CONTENT_TYPES.BRANCH }],
    items: [itemData],
    createdBy: {
        user: { type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null },
        date: { type: Date, default: new Date() }
    },
    editedBy: {
        user: { type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null },
        date: { type: Date, default: new Date() }
    }

}, { collection: 'distributionForms' });

module.exports = schema;
