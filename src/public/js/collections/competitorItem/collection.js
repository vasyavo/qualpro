define(function(require) {
    var Parent = require('collections/parrent');
    var Model = require('models/competitorItem');
    var CONTENT_TYPES = require('constants/contentType');

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
