define([
        'collections/parrent',
        'models/questionnary',
        'constants/contentType'
    ],
    function (Parrent, Model, CONTENT_TYPES) {
        var Collection = Parrent.extend({
            model      : Model,
            url        : CONTENT_TYPES.QUESTIONNARIES,
            viewType   : null,
            contentType: null,

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