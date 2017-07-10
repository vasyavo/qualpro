define(function(require) {
    var _ = require('underscore');
    var Parent = require('collections/parrent');
    var Model = require('models/contactUs');
    var CONTENT_TYPES = require('constants/contentType');

    var Collection = Parent.extend({
        model      : Model,
        url        : CONTENT_TYPES.CONTACT_US,
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
