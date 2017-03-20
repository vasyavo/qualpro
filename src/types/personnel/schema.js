const Schema = require('mongoose').Schema;
const CONTENT_TYPES = require('./../../public/js/constants/contentType');

const ObjectId = Schema.Types.ObjectId;

const schema = new Schema({
    ID: {
        type: String,
        required: false,
    },
    pass: {
        type: String,
        required: false,
    },
    beforeAccess: {
        type: Date,
        required: false,
    },
    lastAccess: {
        type: Date,
        required: false,
    },
    imageSrc: {
        type: ObjectId,
        ref: CONTENT_TYPES.PREVIEW,
        default: null,
    },
    firstName: {
        type: {
            en: {
                type: String,
                required: false,
                default: '',
            },
            ar: {
                type: String,
                required: false,
                default: '',
            },
        },
        required: false,
    },
    lastName: {
        type: {
            en: {
                type: String,
                required: false,
                default: '',
            },
            ar: {
                type: String,
                required: false,
                default: '',
            },
        },
        required: false,
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
    email: {
        type: String,
    },
    phoneNumber: {
        type: String,
    },
    super: {
        type: Boolean,
        default: false,
    },
    manager: {
        type: ObjectId,
        ref: CONTENT_TYPES.PERSONNEL,
        default: null,
    },
    xlsManager: {
        type: Number,
        default: null,
    },
    position: {
        type: ObjectId,
        ref: CONTENT_TYPES.POSITION,
        default: null,
    },
    accessRole: {
        type: ObjectId,
        ref: CONTENT_TYPES.ROLE,
        default: null,
    },
    dateJoined: {
        type: Date,
    },
    confirmed: {
        type: Date,
    },
    token: {
        type: String,
    },
    archived: {
        type: Boolean,
        default: false,
    },
    whoCanRW: {
        type: String,
        enum: ['owner', 'group', 'everyOne'],
        default: 'everyOne',
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
    description: {
        type: String,
        required: false,
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
    forgotToken: {
        type: String,
        required: false,
    },
    vacation: {
        onLeave: {
            type: Boolean,
            default: false,
        },
        cover: {
            type: ObjectId,
            ref: CONTENT_TYPES.PERSONNEL,
            default: null,
        },
    },
    temp: {
        type: Boolean,
        default: false,
    },
    status: {
        type: String,
        enum: ['login', 'archived', 'sendPass', 'neverLogin', 'onLeave', 'temp', 'inactive'],
        default: 'sendPass',
    },
    avgRating: {
        monthly: {
            type: Number,
            min: 1,
            max: 5,
        },
        biYearly: {
            type: Number,
            min: 1,
            max: 5,
        },
    },
    currentLanguage: {
        type: String,
        required: false,
        enum: ['en', 'ar'],
        default: 'en',
    },
    lasMonthEvaluate: {
        type: String,
        default: null,
    },
}, {
    autoIndex: false,
    collection: `${CONTENT_TYPES.PERSONNEL}s`,
    versionKey: false,
});

schema.virtual('fullName').get(function() {
    return `${this.firstName.en} ${this.lastName.en}`;
});

schema.set('toJSON', { virtuals: true });

schema.index({
    'firstName.en': 1,
    'lastName.en': 1,
}, { unique: true });
schema.index({ phoneNumber: 1 }, { unique: true });
schema.index({ email: 1 }, { unique: true });

module.exports = schema;
