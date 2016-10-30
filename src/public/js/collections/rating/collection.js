define([
    'Backbone',
    'models/rating'
], function (Backbone,Model) {
    var Collection = Backbone.Collection.extend({
        model: Model,

        initialize: function (options) {
            this.contentType = options.contentType;

            this.fetch({
                data   : {
                    personnel : options.personnel,
                    recentsNum: options.recentsNum
                },
                reset  : true,
                success: function () {
                },
                error  : function () {
                }
            });
        },

        url: function () {
            return '/rating/' + this.contentType;
        }
    });

    return Collection;
});
