define([
        'collections/parrent',
        'models/retailSegment',
        'constants/contentType'
    ],
    function (Parrent, Model, CONTENT_TYPES) {
        var Collection = Parrent.extend({
            model      : Model,
            url        : CONTENT_TYPES.RETAILSEGMENT,
            viewType   : null,
            contentType: CONTENT_TYPES.RETAILSEGMENT,

            initialize: function (options) {
                var page;

                options = options || {};
                page = options.page;
                options.reset = true;

                this.subRegionId = options.subRegion;

                if (options.create !== false) {
                    this.getPage(page, options);
                }
            }
        });
        return Collection;
    });