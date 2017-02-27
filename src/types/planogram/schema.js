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
    retailSegment: [{
        type: ObjectId,
        ref: CONTENT_TYPES.RETAILSEGMENT,
    }],
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
            default: new Date(),
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
            default: new Date(),
        },
    },
}, {
    autoIndex: false,
    collection: 'planograms',
});

module.exports = schema;
