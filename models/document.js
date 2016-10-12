module.exports = (function () {
    'use strict';

    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var documentSchema = mongoose.Schema({
        title       : {type: String, unique: true, require: true},
        archived    : {type: Boolean, default: false},
        attachments : {type: ObjectId, ref: CONTENT_TYPES.FILES, default: null},
        createdBy   : {
            user: {
                type   : ObjectId,
                ref    : CONTENT_TYPES.PERSONNEL,
                default: null
            },
            date: {
                type   : Date,
                default: new Date()
            }
        },
        editedBy    : {
            user: {
                type   : ObjectId,
                ref    : CONTENT_TYPES.PERSONNEL,
                default: null
            },
            date: {
                type   : Date,
                default: new Date()
            }
        },
        contentType : {type: String, default: null},
        originalName: {type: String, default: null},
        preview     : {type: String, default: null}

    }, {collection: 'documents'});

    mongoose.model(CONTENT_TYPES.DOCUMENTS, documentSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas[CONTENT_TYPES.DOCUMENTS] = documentSchema;
})();