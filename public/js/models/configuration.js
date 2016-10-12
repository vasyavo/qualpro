define([
        'models/parrent',
        'validation',
        'constants/contentType'
    ],
    function (parent, validation, CONTENT_TYPES) {
        var Model = parent.extend({
            defaults: {},

            urlRoot: function () {
                return CONTENT_TYPES.RETAILSEGMENT;
            }
        });

        return Model;
    });