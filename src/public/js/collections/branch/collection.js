define([
        'collections/parrent',
        'models/branch',
        'constants/contentType'
    ],
    function (Parrent, Model, CONTENT_TYPES) {
        var Collection = Parrent.extend({
            model      : Model,
            url        : CONTENT_TYPES.BRANCH,
            viewType   : null,
            contentType: CONTENT_TYPES.BRANCH,

            initialize: function (options) {
                var page;

                options = options || {};
                page = options.page;
                options.reset = true;

                this.subRegion = options.subRegion;
                this.retailSegment = options.retailSegment;
                this.outlet = options.outlet;
                this.getPage(page, options);
            }
        });
        return Collection;
    });