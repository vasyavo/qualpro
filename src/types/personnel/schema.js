const Schema = require('mongoose').Schema;
const CONTENT_TYPES = require('./../../public/js/constants/contentType');

const ObjectId = Schema.Types.ObjectId;
const defaultAvatar = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJYAAACWAQMAAAAGz+OhAAAABlBMVEXNy8v///83JiJ6AAABlUlEQVRIx+3UMWrEQAyFYQ0Dcekj+ApbpgjrK6XcbuZocxQfYUoXZhRJtmGfxhAIKUJYNbt8jX+EZXrNv5vEzKszltmQglpDi6zzMxuuTJ/pbdXGX7fvn9uIwlXzn7VQe4trb8PW29hiZxOHC8sXVpK3kZfZ28B1YobX6C3yOvI++bApsAbalNOINdBmOWzOicNh9bQyc/a2SOCD0KoESiXYOuj/CLZFuw2wFuw20rOxBOovmATqKsA0UFYBpoHJmQbOJYJp4FQDmAaOG4Fp4NDQ2DZICcw2mNFsg3kGs8DizAInNA1cnGmgs6KB3jSwepPAOjqTQG83Cfx09i6BN2cfEkjO7hLobZbAzjI3mtxeSuLOFgn0ViUQrY6rbhBt2HSDzppuEGyNrBtECyyBEWwjPc0A1ihpoDMLTM/GFKsGguX9isEKkQaCyW1pIJjdUYtg+x0FMN5vB63snxmwlR4aCMZsG3RmGzxt2s02uKDZBgt8YNk2mA8LO+1XjGOBnY0XNlxYvLCg5odzb4n6udNrXnPOF+LsukzuroMwAAAAAElFTkSuQmCC';

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
        type: String,
        required: false,
        default: defaultAvatar,
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
        required: false,
        default: [],
    },
    region: {
        type: [{
            type: ObjectId,
            ref: CONTENT_TYPES.DOMAIN,
        }],
        required: false,
        default: [],
    },
    subRegion: {
        type: [{
            type: ObjectId,
            ref: CONTENT_TYPES.DOMAIN,
        }],
        required: false,
        default: [],
    },
    branch: {
        type: [{
            type: ObjectId,
            ref: CONTENT_TYPES.BRANCH,
        }],
        required: false,
        default: [],
    },
    email: {
        type: String,
        required: false,
    },
    phoneNumber: {
        type: String,
        required: false,
    },
    super: {
        type: Boolean,
        required: false,
        default: false,
    },
    manager: {
        type: ObjectId,
        required: false,
        ref: CONTENT_TYPES.PERSONNEL,
        default: null,
    },
    xlsManager: {
        type: Number,
        required: false,
        default: null,
    },
    position: {
        type: ObjectId,
        required: false,
        ref: CONTENT_TYPES.POSITION,
        default: null,
    },
    accessRole: {
        type: ObjectId,
        required: false,
        ref: CONTENT_TYPES.ROLE,
        default: null,
    },
    dateJoined: {
        type: Date,
        required: false,
    },
    confirmed: {
        type: Date,
        required: false,
    },
    token: {
        type: String,
        required: false,
    },
    archived: {
        type: Boolean,
        required: false,
        default: false,
    },
    whoCanRW: {
        type: String,
        required: false,
        enum: ['owner', 'group', 'everyOne'],
        default: 'everyOne',
    },
    groups: {
        type: {
            owner: {
                type: ObjectId,
                required: false,
                ref: CONTENT_TYPES.PERSONNEL,
                default: null,
            },
            users: {
                type: [{
                    type: ObjectId,
                    ref: CONTENT_TYPES.PERSONNEL,
                    default: null,
                }],
                required: false,
                default: [],
            },
            group: {
                type: [{
                    type: ObjectId,
                    ref: CONTENT_TYPES.OUTLET,
                    default: null,
                }],
                required: false,
                default: [],
            },
        },
        required: false,
    },
    description: {
        type: String,
        required: false,
    },
    createdBy: {
        type: {
            user: {
                type: ObjectId,
                required: false,
                ref: CONTENT_TYPES.PERSONNEL,
                default: null,
            },
            date: {
                type: Date,
                required: false,
                default: Date.now(),
            },
        },
        required: false,
    },
    editedBy: {
        type: {
            user: {
                type: ObjectId,
                required: false,
                ref: CONTENT_TYPES.PERSONNEL,
                default: null,
            },
            date: {
                type: Date,
                required: false,
                default: Date.now(),
            },
        },
        required: false,
    },
    forgotToken: {
        type: String,
        required: false,
    },
    vacation: {
        type: {
            onLeave: {
                type: Boolean,
                required: false,
                default: false,
            },
            cover: {
                type: ObjectId,
                required: false,
                ref: CONTENT_TYPES.PERSONNEL,
                default: null,
            },
        },
        default: {
            onLeave: false,
            cover: null,
        },
        required: false,
    },
    temp: {
        type: Boolean,
        required: false,
        default: false,
    },
    status: {
        type: String,
        required: false,
        enum: ['login', 'archived', 'sendPass', 'neverLogin', 'onLeave', 'temp', 'inactive'],
        default: 'sendPass',
    },
    avgRating: {
        monthly: {
            type: Number,
            required: false,
            min: 1,
            max: 5,
        },
        biYearly: {
            type: Number,
            required: false,
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
    collection: 'personnels',
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
schema.index({
    'firstName.en': 1,
    'lastName.en': 1,
    email: 1,
}, { unique: true });
schema.index({
    'firstName.en': 1,
    'lastName.en': 1,
    phoneNumber: 1,
}, { unique: true });

module.exports = schema;
