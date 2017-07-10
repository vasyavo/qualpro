define(function(require) {
    var $ = require('jquery');
    var _ = require('underscore');
    var Backbone = require('backbone');
    var Parent = require('collections/parrent');
    var Model = require('models/marketingCampaign');
    var CONTENT_TYPES = require('constants/contentType');

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
