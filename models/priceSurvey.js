'use strict';

module.exports = (function () {
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var schema = new mongoose.Schema({
        category     : {type: ObjectId, ref: CONTENT_TYPES.CATEGORY},
        variant      : {type: ObjectId, ref: CONTENT_TYPES.COMPETITORVARIANT},
        country      : {type: ObjectId, ref: CONTENT_TYPES.DOMAIN},
        region       : {type: ObjectId, ref: CONTENT_TYPES.DOMAIN},
        subRegion    : {type: ObjectId, ref: CONTENT_TYPES.DOMAIN},
        retailSegment: {type: ObjectId, ref: CONTENT_TYPES.RETAILSEGMENT},
        outlet       : {type: ObjectId, ref: CONTENT_TYPES.OUTLET},
        branch       : {type: ObjectId, ref: CONTENT_TYPES.BRANCH},
        items        : [{
            _id  : false,
            brand: {type: ObjectId, ref: CONTENT_TYPES.BRAND},
            size : {type: String},
            price: {type: Number, min: 0, default: 0}
        }],

        createdBy: {
            user: {type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null},
            date: {
                type   : Date,
                default: new Date()
            }
        }
    }, {collection: 'priceSurveys'});

    mongoose.model(CONTENT_TYPES.PRICESURVEY, schema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas[CONTENT_TYPES.PRICESURVEY] = schema;
})();
