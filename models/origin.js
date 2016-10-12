module.exports = (function () {
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var mongoose = require('mongoose');
    var schema = new mongoose.Schema({
        name     : {
            en: {type: String, default: ''},
            ar: {type: String, default: ''}
        },
        ID       : String

    }, {collection: 'origins'});

    schema.index({'name.en': 1, 'name.ar': 1}, {unique: true});

    mongoose.model(CONTENT_TYPES.ORIGIN, schema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas[CONTENT_TYPES.ORIGIN] = schema;
})();