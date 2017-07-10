define(function(require) {
    var Parent = require('collections/parrent');
    var Model = require('models/brandingAndMonthlyDisplay');
    var CONTENT_TYPES = require('constants/contentType');

    var Collection = Parent.extend({
        model      : Model,
        url        : CONTENT_TYPES.BRANDING_AND_MONTHLY_DISPLAY,
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
