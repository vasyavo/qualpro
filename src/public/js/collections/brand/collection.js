define(function(require) {
    var Parent = require('collections/parrent');
    var Model = require('models/brand');
    var CONTENT_TYPES = require('constants/contentType');

    var Collection = Parent.extend({
        model      : Model,
        url        : CONTENT_TYPES.BRAND,
        viewType   : null,
        contentType: CONTENT_TYPES.BRAND,

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
