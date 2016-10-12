module.exports = (function () {
    'use strict';

    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var schema = new mongoose.Schema({
        title      : {type: String, default: '', require: true},
        theme      : {type: String, default: '', require: true},
        description: {type: String, default: '', require: true},
        archived   : {type: Boolean, default: false},
        createdBy  : {
            user: {type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null},
            date: {type: Date, default: new Date()}
        },
        editedBy: {
            user: {type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null},
            date: {type: Date, default: new Date()}
        }
    }, {collection: 'notes'});

    mongoose.model(CONTENT_TYPES.NOTES, schema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas[CONTENT_TYPES.NOTES] = schema;
})();