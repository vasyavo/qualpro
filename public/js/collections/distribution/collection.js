define([
        'collections/parrent',
        'models/distribution'
    ],
    function (Parrent, Model) {
        var Collection = Parrent.extend({
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
