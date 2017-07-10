define(function(require) {
    var Parent = require('collections/parrent');
    var Model = require('models/competitorBranding');
    var CONTENT_TYPES = require('constants/contentType');

    var Collection = Parent.extend({
        model      : Model,
        url        : CONTENT_TYPES.COMPETITORBRANDING,
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
