define(function(require) {
    var _ = require('underscore');
    var Parent = require('collections/parrent');
    var Model = require('models/distribution');
    var CONTENT_TYPES = require('constants/contentType');

    var Collection = Parent.extend({
        model      : Model,
        url        : '/form/distribution/',
        viewType   : null,
        contentType: null,

        initialize: function (options) {
            var page;

            options = options || {};
            page = options.page;
            options.reset = true;


            this.getPage(page, options);
        },

        parse: function (response) {
            this.totalRecords = response.total;
            this.itemCount = response.itemCount;
            this.itemsNumber = this.pageSize;

            return response.data;
        }
    });

    return Collection;
});
