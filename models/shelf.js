module.exports = (function () {
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var schema = new mongoose.Schema({
        country : {type: ObjectId, ref: CONTENT_TYPES.DOMAIN, default: null},
        outlet  : {type: ObjectId, ref: 'outlet'},
        branch  : {type: ObjectId, ref: CONTENT_TYPES.BRANCH},
        category: {type: ObjectId, ref: CONTENT_TYPES.CATEGORY, default: null},
        shares  : {
            item            : {type: ObjectId, ref: CONTENT_TYPES.ITEM},
            distanceInMeters: {type: Number}
        },

        comments  : {type: [ObjectId], ref: CONTENT_TYPES.COMMENT},
        isArchived: Boolean,

        creationDate: {type: Date, default: new Date()},
        createdBy   : {
            user: {type: ObjectId, ref: CONTENT_TYPES.OUTLET, default: null},
            date: {type: Date, default: new Date()}
        },

        editedBy: {
            user: {type: ObjectId, ref: CONTENT_TYPES.OUTLET, default: null},
            date: {type: Date, default: new Date()}
        }
    }, {collection: 'shelves'});

    mongoose.model(CONTENT_TYPES.SHELF, schema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas[CONTENT_TYPES.SHELF] = schema;
})();