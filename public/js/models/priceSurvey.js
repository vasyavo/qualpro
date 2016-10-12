define([
        'models/parrent',
        'validation',
        'constants/contentType'
    ],
    function (parent, validation, CONTENT_TYPES) {
        var Model = parent.extend({
            idAttribute: '_id',

            multilanguageFields: [
                'category.name',
                'brands.brand.name',
                'brands.variants.variant.name',
                'brands.variants.branches.branch.name',
                'branchesAll.name'
            ],

            urlRoot: function () {
                return CONTENT_TYPES.PRICESURVEY;
            }
        });
        return Model;
    });
