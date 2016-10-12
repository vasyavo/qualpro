module.exports = (function () {
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var schema = mongoose.Schema({
        name: {
            en: {type: String, default: '', index: {unique: true, sparse: true}},
            ar: {type: String, default: '', index: {unique: true, sparse: true}}
        },
        category : {type: ObjectId, ref: CONTENT_TYPES.CATEGORY},
        //brand    : {type: ObjectId, ref: CONTENT_TYPES.BRAND},
        archived : {type: Boolean, default: false},
        topArchived: {type: Boolean, default: false},
        createdBy: {
            user: {type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null},
            date: {type: Date, default: Date.now}
        },
        editedBy : {
            user: {type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null},
            date: {type: Date}
        }

    }, {collection: 'competitorVariants'});

    mongoose.model(CONTENT_TYPES.COMPETITORVARIANT, schema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas[CONTENT_TYPES.COMPETITORVARIANT] = schema;
})();