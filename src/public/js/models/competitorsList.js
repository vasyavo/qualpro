define([
        'models/parrent',
        'validation',
        'constants/contentType'
    ],
    function (parent, validation, CONTENT_TYPES) {
        var Model = parent.extend({
            defaults: {},

            multilanguageFields: [
                'name',
                'brand.name',
                'variant.name',
                'product.name',
                'origin.name',
                'brandName',
                'categories.categoryName',
                'categories.variants.variantName',
                'categories.variants.items.name',
                'categories.variants.items.origin.name'
            ],

            validate: function (attrs) {
                var errors = [];

                if (errors.length > 0) {
                    return errors;
                }
            },

            urlRoot: function () {
                return '/competitorList';
            }
        });

        return Model;
    });