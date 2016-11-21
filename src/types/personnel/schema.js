'use strict';

const Schema = require('mongoose').Schema;
const ObjectId = Schema.Types.ObjectId;
const CONTENT_TYPES = require('./../../public/js/constants/contentType.js');

const schema = new Schema({
    ID: String,
    pass: { type: String, default: '' },
    beforeAccess: Date,
    lastAccess: Date,
    imageSrc: {
        type: String,
        default: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJYAAACWAQMAAAAGz+OhAAAABlBMVEXNy8v///83JiJ6AAABlUlEQVRIx+3UMWrEQAyFYQ0Dcekj+ApbpgjrK6XcbuZocxQfYUoXZhRJtmGfxhAIKUJYNbt8jX+EZXrNv5vEzKszltmQglpDi6zzMxuuTJ/pbdXGX7fvn9uIwlXzn7VQe4trb8PW29hiZxOHC8sXVpK3kZfZ28B1YobX6C3yOvI++bApsAbalNOINdBmOWzOicNh9bQyc/a2SOCD0KoESiXYOuj/CLZFuw2wFuw20rOxBOovmATqKsA0UFYBpoHJmQbOJYJp4FQDmAaOG4Fp4NDQ2DZICcw2mNFsg3kGs8DizAInNA1cnGmgs6KB3jSwepPAOjqTQG83Cfx09i6BN2cfEkjO7hLobZbAzjI3mtxeSuLOFgn0ViUQrY6rbhBt2HSDzppuEGyNrBtECyyBEWwjPc0A1ihpoDMLTM/GFKsGguX9isEKkQaCyW1pIJjdUYtg+x0FMN5vB63snxmwlR4aCMZsG3RmGzxt2s02uKDZBgt8YNk2mA8LO+1XjGOBnY0XNlxYvLCg5odzb4n6udNrXnPOF+LsukzuroMwAAAAAElFTkSuQmCC'
    },
    firstName: {
        en: { type: String, default: '' },
        ar: { type: String, default: '' }
    },
    lastName: {
        en: { type: String, default: '' },
        ar: { type: String, default: '' }
    },
    country: [{ type: ObjectId, ref: CONTENT_TYPES.DOMAIN }],
    region: [{ type: ObjectId, ref: CONTENT_TYPES.DOMAIN }],
    subRegion: [{ type: ObjectId, ref: CONTENT_TYPES.DOMAIN }],
    branch: [{ type: ObjectId, ref: CONTENT_TYPES.BRANCH }],
    email: { type: String },
    phoneNumber: { type: String },
    super: { type: Boolean, default: false },
    manager: { type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null },
    xlsManager: { type: Number, default: null },
    position: { type: ObjectId, ref: CONTENT_TYPES.POSITION, default: null },
    accessRole: { type: ObjectId, ref: CONTENT_TYPES.ROLE, default: null },
    dateJoined: Date,
    confirmed: Date,
    token: String,
    archived: { type: Boolean, default: false },
    whoCanRW: { type: String, enum: ['owner', 'group', 'everyOne'], default: 'everyOne' },
    groups: {
        owner: { type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null },
        users: [{ type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null }],
        group: [{ type: ObjectId, ref: CONTENT_TYPES.OUTLET, default: null }]
    },
    description: { type: String, default: '' },
    createdBy: {
        user: { type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null },
        date: { type: Date, default: new Date() }
    },
    editedBy: {
        user: { type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null },
        date: { type: Date, default: new Date() }
    },
    forgotToken: { type: String },
    vacation: {
        onLeave: { type: Boolean, default: false },
        cover: { type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null }
    },
    temp: { type: Boolean, default: false },
    status: {
        type: String,
        enum: ['login', 'archived', 'sendPass', 'neverLogin', 'onLeave', 'temp', 'inactive'],
        default: 'sendPass'
    },
    avgRating: {
        monthly: { type: Number, min: 1, max: 5 },
        biYearly: { type: Number, min: 1, max: 5 }
    },
    currentLanguage: { type: String, enum: ['en', 'ar'], default: 'en' },
    lasMonthEvaluate: { type: String, default: null }
}, { collection: 'personnels', versionKey: false });

schema.virtual('fullName').get(function() {
    return this.firstName.en + ' ' + this.lastName.en;
});

schema.set('toJSON', { virtuals: true });

module.exports = schema;
