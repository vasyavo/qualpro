module.exports = (function () {
    'use strict';

    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var OTHER_CONSTANTS = require('../public/js/constants/otherConstants.js');
    var PROMOTION_STATUSES = OTHER_CONSTANTS.PROMOTION_STATUSES;
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var schema = new mongoose.Schema({
        type       : {type: String, default: '', require: true},
        category   : [{type: ObjectId, ref: CONTENT_TYPES.CATEGORY, require: true}],
        activity   : {type: String, default: ''},
        promotion  : {type: String, default: ''},
        displayType: {
            type   : Number,
            ref    : CONTENT_TYPES.DISPLAYTYPE,
            default: 16,
            require: true
        },

        country      : {type: ObjectId, ref: CONTENT_TYPES.DOMAIN, default: null, require: true},
        region       : {type: Array, ref: CONTENT_TYPES.DOMAIN, default: [], require: true},
        subRegion    : {type: Array, ref: CONTENT_TYPES.DOMAIN, default: [], require: true},
        retailSegment: {type: Array, ref: CONTENT_TYPES.RETAILSEGMENT, default: [], require: true},
        outlet       : {type: Array, ref: CONTENT_TYPES.OUTLET, default: [], require: true},
        branch       : {type: Array, ref: CONTENT_TYPES.BRANCH, default: [], require: true},
        budget       : {type: Number, require: true},
        actual       : {type: Number, require: true},
        salesTarget  : {type: Number, require: true},
        status       : {
            type   : String,
            enum   : [PROMOTION_STATUSES.DRAFT, PROMOTION_STATUSES.ACTIVE, PROMOTION_STATUSES.EXPIRED],
            default: PROMOTION_STATUSES.DRAFT,
            require: true
        },

        dateStart  : {type: Date, require: true},
        dateEnd    : {type: Date, require: true},
        description: {
            en: {type: String, default: ''},
            ar: {type: String, default: ''}
        },

        documents: {type: Array, default: [], require: true},
        createdBy: {
            user: {type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null},
            date: {
                type   : Date,
                default: Date.now
            }
        },

        editedBy: {
            user: {type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null},
            date: {
                type   : Date,
                default: Date.now
            }
        }
    }, {collection: 'contractsSecondary'});

    mongoose.model(CONTENT_TYPES.CONTRACTSSECONDARY, schema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas[CONTENT_TYPES.CONTRACTSSECONDARY] = schema;
})();