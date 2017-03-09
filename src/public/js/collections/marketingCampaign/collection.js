define([
        'backbone',
        'jQuery',
        'Underscore',
        'collections/parrent',
        'models/marketingCampaign',
        'constants/contentType'
    ],
    function (Backbone, $, _, Parent, Model, CONTENT_TYPES) {
        var Collection = Parent.extend({
            model      : Model,
            url        : CONTENT_TYPES.MARKETING_CAMPAIGN,
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