module.exports = (function () {
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    /**
     * @constructor CurrencyModel
     * @type {*|Schema}
     *
     * @property {String} _id
     * @property {String} name
     */

    var schema = mongoose.Schema({
        _id : {type: String, unique: true},
        name: {type: String, default: 'All'}
    }, {collection: 'currencies'});

    mongoose.model(CONTENT_TYPES.CURRENCY, schema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas[CONTENT_TYPES.CURRENCY] = schema;
})();