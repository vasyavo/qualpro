'use strict';

module.exports = (function () {
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var schema = new mongoose.Schema({
        description: {
            en: {type: String, default: ''},
            ar: {type: String, default: ''}
        },

        category     : [{type: ObjectId, ref: CONTENT_TYPES.CATEGORY, default: null, require: true}],
        brand        : {type: ObjectId, ref: CONTENT_TYPES.BRAND, require: true},
        country      : {type: ObjectId, ref: CONTENT_TYPES.DOMAIN, require: true},
        region       : {type: ObjectId, ref: CONTENT_TYPES.DOMAIN, require: true},
        subRegion    : {type: ObjectId, ref: CONTENT_TYPES.DOMAIN, require: true},
        retailSegment: {type: ObjectId, ref: CONTENT_TYPES.RETAILSEGMENT, require: true},
        outlet       : {type: ObjectId, ref: CONTENT_TYPES.OUTLET, require: true},
        branch       : {type: ObjectId, ref: CONTENT_TYPES.BRANCH, require: true},
        location     : {
            en: {type: String, default: ''},
            ar: {type: String, default: ''}
        },

        displayType: {
            type   : Number,
            ref    : CONTENT_TYPES.DISPLAYTYPE,
            default: 16,
            require: true
        },

        dateStart  : {type: Date},
        dateEnd    : {type: Date},
        comments   : [{type: ObjectId, ref: CONTENT_TYPES.COMMENT, default: null}],
        attachments: {type: Array, default: [], require: true},
        archived   : {
            type   : Boolean,
            default: false
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
    }, {collection: 'competitorBranding'});

    mongoose.model(CONTENT_TYPES.COMPETITORBRANDING, schema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas[CONTENT_TYPES.COMPETITORBRANDING] = schema;
})();
