define([
        'models/parrent',
        'validation',
        'constants/contentType'
    ],
    function (parent, validation, CONTENT_TYPES) {
        var Model = parent.extend({
            defaults: {
                name    : '',
                selected: false
            },

            multilanguageFields: [
                'name'
            ],

            idAttribute: '_id',

            urlRoot: function () {
                return CONTENT_TYPES.ORIGIN;
            }
        });

        return Model;
    });