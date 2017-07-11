var parent = require('./parrent');
var CONTENT_TYPES = require('../constants/contentType');

module.exports = parent.extend({
    idAttribute: '_id',

    multilanguageFields: [
        'category.name',
        'brands.name'
    ],

    urlRoot: function () {
        return CONTENT_TYPES.SHELFSHARES;
    }
});
