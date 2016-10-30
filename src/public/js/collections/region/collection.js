define([
        'collections/parrent',
        'models/region',
        'constants/contentType'
    ],
    function (Parrent, Model, CONTENT_TYPES) {
        var Collection = Parrent.extend({
            model      : Model,
            url        : CONTENT_TYPES.REGION,
            viewType   : null,
            contentType: CONTENT_TYPES.REGION,
            initialize : function (options) {
                var page;

                this.parentCT = CONTENT_TYPES.COUNTRY;

                options = options || {};
                page = options.page;
                options.reset = true;
                options.parentCT = this.parentCT;

                this.parent = options.parent;

                if (options.create !== false) {
                    this.getPage(page, options);
                }
            }
        });
        return Collection;
    });