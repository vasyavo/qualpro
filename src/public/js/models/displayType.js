define([
        'models/parrent',
        'validation',
        'constants/contentType'
    ],
    function (parent, validation, CONTENT_TYPES) {
        var Model = parent.extend({
            defaults: {},

            multilanguageFields: [
                'name'
            ],

            urlRoot: function () {
                return CONTENT_TYPES.DISPLAYTYPE;
            }
        });

        return Model;
    });
