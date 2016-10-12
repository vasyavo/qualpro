module.exports = (function () {
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var schema = mongoose.Schema({
        _id : {type: Number},
        name: {
            en: {type: String},
            ar: {type: String}
        }
    }, {collection: 'displayTypes'});

    // schema.index({"name.en": 1, "name.ar": 1}, {unique: true});

    mongoose.model(CONTENT_TYPES.DISPLAYTYPE, schema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas[CONTENT_TYPES.DISPLAYTYPE] = schema;
})();
