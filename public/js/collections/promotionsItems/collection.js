define([
    'collections/parrent',
    'models/promotionsItems',
    'constants/contentType'
], function (Parrent, Model, CONTENT_TYPES) {
    var Collection = Parrent.extend({
        model      : Model,
        url        : CONTENT_TYPES.PROMOTIONSITEMS,
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
            this.itemCount = response.count; //itemCount;
            this.itemsNumber = this.pageSize;

            return response.data;
        }
    });

    return Collection;
});
