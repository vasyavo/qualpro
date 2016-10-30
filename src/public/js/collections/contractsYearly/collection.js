define([
        'collections/parrent',
        'models/contractsYearly',
        'constants/contentType'
    ],
    function (Parrent, Model, CONTENT_TYPES) {
        'use strict';

        var Collection = Parrent.extend({
            model      : Model,
            url        : CONTENT_TYPES.CONTRACTSYEARLY,
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