module.exports = (function () {
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var schema = new mongoose.Schema({
        name: {
            en: {type: String, default: '', index: {unique: true, sparse: true}},
            ar: {type: String, default: '', index: {unique: true, sparse: true}}
        },

        archived   : {type: Boolean, default: false},
        topArchived: {type: Boolean, default: false},
        createdBy  : {
            user: {type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null},
            date: {type: Date, default: new Date()}
        },

        editedBy: {
            user: {type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null},
            date: {type: Date}
        }
    }, {collection: 'categories'});

    mongoose.model(CONTENT_TYPES.CATEGORY, schema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas[CONTENT_TYPES.CATEGORY] = schema;
})();