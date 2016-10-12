define([
        'models/parrent',
        'validation',
        'constants/contentType',
        'custom'
    ],
    function (parent, validation, CONTENT_TYPES, custom) {
        var Model = parent.extend({
            idAttribute: '_id',

            multilanguageFields: [
                'branch.name',
                'brand.name',
                'category.name',
                'employee.name'
            ],

            urlRoot: function () {
                return CONTENT_TYPES.PRICESURVEY + '/brands';
            }
        });
        return Model;
    });
