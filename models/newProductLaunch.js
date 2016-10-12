'use strict';

module.exports = (function () {
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var schema = new mongoose.Schema({
        additionalComment: {
            en: {type: String, default: ''},
            ar: {type: String, default: ''}
        },

        category: {type: ObjectId, ref: CONTENT_TYPES.CATEGORY, default: null},
        brand   : {
            _id : {type: ObjectId, ref: CONTENT_TYPES.BRAND},
            name: {type: String, default: ''}
        },

        variant: {
            _id : {type: ObjectId, ref: CONTENT_TYPES.COMPETITORVARIANT},
            name: {type: String, default: ''}
        },

        country      : {type: ObjectId, ref: CONTENT_TYPES.DOMAIN},
        region       : {type: ObjectId, ref: CONTENT_TYPES.DOMAIN},
        subRegion    : {type: ObjectId, ref: CONTENT_TYPES.DOMAIN},
        retailSegment: {type: ObjectId, ref: CONTENT_TYPES.RETAILSEGMENT},
        outlet       : {type: ObjectId, ref: CONTENT_TYPES.OUTLET},
        branch       : {type: ObjectId, ref: CONTENT_TYPES.BRANCH},
        origin       : {type: ObjectId, ref: CONTENT_TYPES.ORIGIN},
        price        : {type: String, default: ''},
        packing      : {type: String, default: ''},
        location     : {
            en: {type: String, default: ''},
            ar: {type: String, default: ''}
        },

        displayType: {type: Number, ref: CONTENT_TYPES.DISPLAYTYPE, default: 16},
        distributor: {
            en: {type: String, default: ''},
            ar: {type: String, default: ''}
        },

        shelfLifeStart: Date,
        shelfLifeEnd  : Date,
        shelfLife     : {type: String, default: null},
        attachments   : {type: Array, default: []},
        archived      : {
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
    }, {collection: 'newProductLaunches'});

    mongoose.model(CONTENT_TYPES.NEWPRODUCTLAUNCH, schema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas[CONTENT_TYPES.NEWPRODUCTLAUNCH] = schema;
})();