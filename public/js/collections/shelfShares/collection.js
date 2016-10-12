define([
        'collections/parrent',
        'models/shelfShares',
        'constants/contentType'
    ],
    function (parrent, Model, contentType) {
        var Collection = parrent.extend({
            model      : Model,
            contentType: contentType.SHELFSHARES,
            url        : function () {
                return '/' + this.contentType;
            },

            initialize: function (options) {
                var page;

                options = options || {};
                page = options.page;
                options.reset = true;

                this.getPage(page, options);
            }
        });

        return Collection;
    });
