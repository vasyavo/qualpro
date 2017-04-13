const Schema = require('mongoose').Schema;
const CONTENT_TYPES = require('./../../public/js/constants/contentType');

const ObjectId = Schema.Types.ObjectId;

const schema = new Schema({
    name: {
        en: {
            type: String,
            default: '',
        },
        ar: {
            type: String,
            default: '',
        },
    },
    profileAccess: {
        type: [{
            module: {
                type: Number,
                ref: 'modules',
            },
            access: {
                read: {
                    type: Boolean,
                    default: false,
                },
                editWrite: {
                    type: Boolean,
                    default: false,
                },
                del: {
                    type: Boolean,
                    default: false,
                },
            },
        }],
        default: [],
    },
    isArchived: Boolean,
    description: String,
    whoCanRW: {
        type: String,
        enum: ['owner', 'group', 'everyOne'],
        default: 'owner',
    },
    groups: {
        owner: {
            type: ObjectId,
            ref: CONTENT_TYPES.PERSONNEL,
            default: null,
        },
        users: {
            type: [{
                type: ObjectId,
                ref: CONTENT_TYPES.PERSONNEL,
            }],
            default: [],
        },
        group: {
            type: [{
                type: ObjectId,
                ref: CONTENT_TYPES.OUTLET,
            }],
            default: [],
        },
    },
    numberOfPersonnels: {
        type: Number,
        default: 0,
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
    collection: `${CONTENT_TYPES.POSITION}s`,
    versionKey: false,
});

schema.index({ 'name.en': 1 }, { unique: true });

module.exports = schema;
