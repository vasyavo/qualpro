const Schema = require('mongoose').Schema;
const CONTENT_TYPES = require('./../../public/js/constants/contentType');

const ObjectId = Schema.Types.ObjectId;

const schema = new Schema({
    personnelId: {
        type: ObjectId,
        ref: CONTENT_TYPES.PERSONNEL,
        required: true,
    },
    questionnaryId: {
        type: ObjectId,
        ref: CONTENT_TYPES.QUESTIONNARIES,
        required: true,
    },
    questionId: {
        type: ObjectId,
        required: true,
    },
    country: {
        type: ObjectId,
        ref: CONTENT_TYPES.DOMAIN,
        default: null,
    },
    region: {
        type: ObjectId,
        ref: CONTENT_TYPES.REGION,
        default: null,
    },
    subRegion: {
        type: ObjectId,
        ref: CONTENT_TYPES.SUBREGION,
        default: null,
    },
    retailSegment: {
        type: ObjectId,
        ref: CONTENT_TYPES.RETAILSEGMENT,
        default: null,
    },
    outlet: {
        type: ObjectId,
        ref: CONTENT_TYPES.OUTLET,
        default: null,
    },
    branch: {
        type: ObjectId,
        ref: CONTENT_TYPES.BRANCH,
        default: null,
    },
    optionIndex: {
        type: [{
            type: Number,
        }],
        default: [],
    },
    text: {
        en: {
            type: String,
        },
        ar: {
            type: String,
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
    collection: CONTENT_TYPES.QUESTIONNARIES_ANSWER,
    versionKey: false,
});

module.exports = schema;
