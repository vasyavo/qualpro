module.exports = (function () {
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var fileSchema = mongoose.Schema({
        name        : {type: String, default: null},
        originalName: {type: String, default: null},
        extension   : {type: String, default: null},
        contentType : {type: String, default: null},
        editedBy    : {
            user: {type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null},
            date: {type: Date}
        },

        createdBy: {
            user: {type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null},
            date: {type: Date, default: new Date()}
        },

        preview: {type: String, default: null}

    }, {collection: 'files'});

    mongoose.model(CONTENT_TYPES.FILES, fileSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas[CONTENT_TYPES.FILES] = fileSchema;
})();