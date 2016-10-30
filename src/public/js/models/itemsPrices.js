define([
    'models/parrent',
    'validation',
    'constants/contentType'
], function (parent, validation, CONTENT_TYPES) {
    var Model = parent.extend({
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

    return Model;
});
