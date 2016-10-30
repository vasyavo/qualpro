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
                'brands.name'
            ],

            urlRoot: function () {
                return CONTENT_TYPES.SHELFSHARES;
            }
        });
        return Model;
    });
