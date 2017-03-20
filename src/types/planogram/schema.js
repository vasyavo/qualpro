const mongoose = require('mongoose');
const CONTENT_TYPES = require('./../../public/js/constants/contentType');

const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const schema = new Schema({
    country: {
        type: ObjectId,
        required: true,
        ref: CONTENT_TYPES.DOMAIN,
    },
    retailSegment: {
        type: [{
            type: ObjectId,
            ref: CONTENT_TYPES.RETAILSEGMENT,
        }],
        default: [],
    },
    product: {
        type: ObjectId,
        ref: CONTENT_TYPES.CATEGORY,
        required: true,
    },
    displayType: {
        _id: {
            type: String,
            enum: ['floorDisplayId', 'gondolaId', 'thematicStandId', 'shelfId', 'otherId'],
        },
        name: {
            ar: String,
            en: String,
        },
    },
    configuration: {
        _id: {
            type: ObjectId,
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
    },
    fileID: {
        type: ObjectId,
        ref: CONTENT_TYPES.FILES,
        default: null,
    },
    archived: {
        type: Boolean,
        default: false,
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
    collection: `${CONTENT_TYPES.PLANOGRAM}s`,
    versionKey: false,
});

module.exports = schema;
