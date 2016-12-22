define([
        'collections/parrent',
        'models/consumersSurvey',
        'constants/contentType'
    ],
    function (Parrent, Model, CONTENT_TYPES) {
        var Collection = Parrent.extend({
            model      : Model,
            url        : CONTENT_TYPES.CONSUMER_SURVEY,
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