define([
    'collections/parrent',
    'models/brandingActivityItems',
    'constants/contentType'
], function (Parrent, Model, CONTENT_TYPES) {
    var Collection = Parrent.extend({
        model      : Model,
        url        : CONTENT_TYPES.BRANDING_ACTIVITY_ITEMS,
        viewType   : null,
        contentType: null,

        initialize: function (options) {
            var page;

            options = options || {};
            page = options.page;
            options.reset = true;

            if (options.fetch) {
                this.getPage(page, options);
            }
        },

        parse: function (response) {
            this.totalRecords = response.total;
            this.itemCount = response.count;
            this.itemsNumber = this.pageSize;

            return response.data;
        }
    });

    return Collection;
});
