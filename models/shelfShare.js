module.exports = (function () {
    var mongoose = require('mongoose');
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var schema = new mongoose.Schema({
        country      : {type: ObjectId, ref: CONTENT_TYPES.COUNTRY, default: null, required: true},
        region       : {type: ObjectId, ref: CONTENT_TYPES.REGION, default: null, required: true},
        subRegion    : {type: ObjectId, ref: CONTENT_TYPES.SUBREGION, default: null, required: true},
        retailSegment: {type: ObjectId, ref: CONTENT_TYPES.RETAILSEGMENT, default: null, required: true},
        outlet       : {type: ObjectId, ref: CONTENT_TYPES.OUTLET, default: null, required: true},
        branch       : {type: ObjectId, ref: CONTENT_TYPES.BRANCH, default: null, required: true},
        category     : {type: ObjectId, ref: CONTENT_TYPES.CATEGORY, default: null, required: true},
        brands       : [{
            brand  : {type: ObjectId, ref: CONTENT_TYPES.BRAND, default: null, required: true},
            length : {type: Number, required: true},
            percent: {type: Number, required: true}
        }],

        totalBrandsLength: {type: Number, required: true},
        createdBy        : {
            user: {type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null},
            date: {type: Date, default: new Date()}
        },

        editedBy: {
            user: {type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null},
            date: {type: Date, default: new Date()}
        }
    }, {collection: CONTENT_TYPES.SHELFSHARES});

    mongoose.model(CONTENT_TYPES.SHELFSHARES, schema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas[CONTENT_TYPES.SHELFSHARES] = schema;
})();