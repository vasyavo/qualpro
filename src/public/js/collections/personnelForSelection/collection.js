define([
        'collections/parrent',
        'models/personnel'
    ],
    function (Parrent, Model) {
        var Collection = Parrent.extend({
            model      : Model,
            viewType   : null,
            contentType: null,

            url: function () {
                return '/' + this.contentType + '/personnelFroSelection';
            },

            initialize: function (options) {
                var page;

                options = options || {};
                page = options.page;
                options.reset = true;

                this.contentType = options.contentType;

                this.getPage(page, options);
            }
        });

        return Collection;
    });