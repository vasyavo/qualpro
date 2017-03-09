define([
        'collections/parrent',
        'models/brandingAndMonthlyDisplay',
        'constants/contentType'
    ],
    function (Parent, Model, CONTENT_TYPES) {
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