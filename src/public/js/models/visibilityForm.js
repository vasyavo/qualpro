define([
        'models/parrent',
        'validation'
    ],
    function (parent, validation) {
        var Model = parent.extend({
            defaults: {},

            validate: function (attrs) {
                var errors = [];
                if (errors.length > 0) {
                    return errors;
                }
            },

            urlRoot: function () {
                return '/form/visibility';
            }
        });

        return Model;
    });