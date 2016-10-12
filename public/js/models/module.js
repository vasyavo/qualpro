define([
        'models/parrent'
    ],
    function (parent) {
        var Model = parent.extend({
            defaults   : {},
            idAttribute: '_id',

            initialize: function () {
                this.fetchAndReset();
            },

            urlRoot: function () {
                return '/modules';
            },

            fetchAndReset: function () {
                var self = this;

                this.fetch({
                    success: function (model) {
                        self.trigger('reset');
                    },
                    error  : function () {
                    }
                });
            }
        });
        return Model;
    });
