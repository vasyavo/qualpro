'use strict';

const Schema = require('mongoose').Schema;
const ObjectId = Schema.Types.ObjectId;
const CONTENT_TYPES = require('./../../public/js/constants/contentType.js');

const schema = new Schema({
    name: { en: { type: String, unique: true }, ar: String },
    profileAccess: [{
        module: { type: Number, ref: "modules" },
        access: {
            read: { type: Boolean, default: false },
            editWrite: { type: Boolean, default: false },
            del: { type: Boolean, default: false }
        }
    }],
    isArchived: Boolean,
    description: String,
    whoCanRW: { type: String, enum: ['owner', 'group', 'everyOne'], default: 'owner' },
    groups: {
        owner: { type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null },
        users: [{ type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null }],
        group: [{ type: ObjectId, ref: CONTENT_TYPES.OUTLET, default: null }]
    },
    numberOfPersonnels: { type: Number, default: 0 },
    createdBy: {
        user: { type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null },
        date: { type: Date, default: Date.now }
    },
    editedBy: {
        user: { type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null },
        date: { type: Date, default: Date.now }
    }
}, { collection: 'positions' });

module.exports = schema;
