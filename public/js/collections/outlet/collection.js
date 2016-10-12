define([
        'collections/parrent',
        'models/outlet',
        'constants/contentType'
    ],
    function (Parrent, Model, CONTENT_TYPES) {
        var Collection = Parrent.extend({
            model      : Model,
            url        : CONTENT_TYPES.OUTLET,
            viewType   : null,
            contentType: CONTENT_TYPES.OUTLET,
            initialize : function (options) {
                var page;

                options = options || {};
                page = options.page;
                options.reset = true;

                this.subRegion = options.subRegion;
                this.retailSegment = options.retailSegment;

                if (options.create !== false) {
                    this.getPage(page, options);
                }
            }
        });
        return Collection;
    });