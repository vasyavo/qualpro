const mongoose = require('mongoose');
const CONTENT_TYPES = require('./../../public/js/constants/contentType');

const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const schema = new Schema({
    itemName: {
        en: {
            type: String,
            default: '',
        },
        ar: {
            type: String,
            default: '',
        },
    },
    country: {
        type: [{
            type: ObjectId,
            ref: CONTENT_TYPES.DOMAIN,
        }],
        default: [],
    },
    region: {
        type: [{
            type: ObjectId,
            ref: CONTENT_TYPES.DOMAIN,
        }],
        default: [],
    },
    subRegion: {
        type: [{
            type: ObjectId,
            ref: CONTENT_TYPES.DOMAIN,
        }],
        default: [],
    },
    branch: {
        type: [{
            type: ObjectId,
            ref: CONTENT_TYPES.BRANCH,
        }],
        default: [],
    },
    retailSegment: {
        type: [{
            type: ObjectId,
            ref: CONTENT_TYPES.RETAILSEGMENT,
        }],
        default: [],
    },
    outlet: {
        type: [{
            type: ObjectId,
            ref: CONTENT_TYPES.OUTLET,
        }],
        default: [],
    },
    assignedTo: {
        type: [{
            type: ObjectId,
            ref: CONTENT_TYPES.PERSONNEL,
        }],
        default: [],
    },
    itemId: {
        type: ObjectId,
        default: null,
    },
    itemDetails: {
        type: String,
        default: '',
    },
    itemType: {
        type: String,
        default: '',
    },
    accessRoleLevel: {
        type: Number,
        default: null,
    },
    module: {
        type: Number,
        default: null,
    },
    actionType: {
        type: String,
        default: '',
    },
    creationDate: {
        type: Date,
        default: Date.now,
    },
    personnels: {
        type: [{
            type: ObjectId,
            ref: CONTENT_TYPES.PERSONNEL,
        }],
        default: [],
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
}, {
    autoIndex: false,
    collection: `${CONTENT_TYPES.ACTIVITYLIST}s`,
    versionKey: false,
});

module.exports = schema;
