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
    level: {
        type: Number,
    },
    roleAccess: {
        type: [{
            _id: false,
            module: {
                type: Number,
                ref: 'modules',
            },
            cms: {
                _id: false,
                read: {
                    type: Boolean,
                    default: false,
                },
                edit: {
                    type: Boolean,
                    default: false,
                },
                write: {
                    type: Boolean,
                    default: false,
                },
                archive: {
                    type: Boolean,
                    default: false,
                },
                evaluate: {
                    type: Boolean,
                    default: false,
                },
                upload: {
                    type: Boolean,
                    default: false,
                },
            },
            mobile: {
                _id: false,
                read: {
                    type: Boolean,
                    default: false,
                },
                edit: {
                    type: Boolean,
                    default: false,
                },
                write: {
                    type: Boolean,
                    default: false,
                },
                archive: {
                    type: Boolean,
                    default: false,
                },
                evaluate: {
                    type: Boolean,
                    default: false,
                },
                upload: {
                    type: Boolean,
                    default: false,
                },
            },
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
    collection: `${CONTENT_TYPES.ACCESSROLE}s`,
    versionKey: false,
});

module.exports = schema;
