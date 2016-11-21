'use strict';
const Schema = require('mongoose').Schema;
const ObjectId = Schema.Types.ObjectId;
const CONTENT_TYPES = require('./../../public/js/constants/contentType.js');

const schema = new Schema({
    name: {
        en: { type: String, default: '', index: { unique: true, sparse: true } },
        ar: { type: String, default: '', index: { unique: true, sparse: true } }
    },

    archived: { type: Boolean, default: false },
    topArchived: { type: Boolean, default: false },
    createdBy: {
        user: { type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null },
        date: { type: Date, default: new Date() }
    },

    editedBy: {
        user: { type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null },
        date: { type: Date }
    }
}, { collection: 'categories' });

module.exports = schema;
