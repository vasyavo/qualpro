'use strict';

module.exports = (function () {
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var schema = new mongoose.Schema({
        objective: {type: ObjectId, ref: CONTENT_TYPES.OBJECTIVES, required: true},
        before   : {
            files: [{type: ObjectId, ref: CONTENT_TYPES.FILES, default: null}]
        },

        after: {
            files      : [{type: ObjectId, ref: CONTENT_TYPES.FILES, default: null}],
            description: {type: String, default: ''}
        },

        createdBy: {
            user: {type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null},
            date: {
                type   : Date,
                default: new Date()
            }
        },

        editedBy: {
            user: {type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null},
            date: {
                type   : Date,
                default: new Date()
            }
        }
    }, {collection: 'visibilityForms', versionKey: false});

    mongoose.model(CONTENT_TYPES.VISIBILITYFORM, schema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }
    mongoose.Schemas[CONTENT_TYPES.VISIBILITYFORM] = schema;
})();