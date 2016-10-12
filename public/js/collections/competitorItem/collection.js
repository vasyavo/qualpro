define([
        'underscore',
        'collections/parrent',
        'models/competitorItem',
        'constants/contentType'
    ],
    function (_, Parrent, Model, CONTENT_TYPES) {
        var Collection = Parrent.extend({
            model      : Model,
            url        : CONTENT_TYPES.COMPETITORITEM,
            viewType   : null,
            contentType: CONTENT_TYPES.COMPETITORITEM,

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