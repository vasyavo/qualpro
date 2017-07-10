define(function(require) {
    var _ = require('underscore');
    var Parent = require('collections/parrent');
    var Model = require('models/contractsYearly');
    var CONTENT_TYPES = require('constants/contentType');

    var Collection = Parrent.extend({
        model      : Model,
        url        : CONTENT_TYPES.CONTRACTSYEARLY,
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
