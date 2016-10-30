define([
        'underscore',
        'collections/parrent',
        'models/displayType',
        'constants/contentType'
    ],
    function (_, Parrent, Model, CONTENT_TYPES) {
        var Collection = Parrent.extend({
            model      : Model,
            url        : CONTENT_TYPES.DISPLAYTYPE,
            viewType   : null,
            contentType: CONTENT_TYPES.DISPLAYTYPE,
            sortOrder  : 1,

            initialize: function (options) {
                var page;

                options = options || {};
                page = options.page;
                options.reset = true;

                this.getPage(page, options);
            },

            comparator: '_id'
        });
        return Collection;
    });
