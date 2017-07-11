var parent = require('./parrent');
var CONTENT_TYPES = require('../constants/contentType');

module.exports = parent.extend({
    defaults: {},

    multilanguageFields: [
        'categoryName',
        'variants.variantName',
        'variants.items.name',
        'variants.items.origin.name',
        'variant.items.origin.name',
        'origin.name',
        'name'
    ],

    validate: function (attrs) {
        var errors = [];

        if (errors.length > 0) {
            return errors;
        }
    },

    urlRoot: function () {
        return CONTENT_TYPES.ITEM;
    }
});
