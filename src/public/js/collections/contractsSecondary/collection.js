define([
        'collections/parrent',
        'models/contractsSecondary',
        'constants/contentType'
    ],
    function (Parent, Model, CONTENT_TYPES) {
        'use strict';

        var Collection = Parent.extend({
            model      : Model,
            url        : CONTENT_TYPES.CONTRACTSSECONDARY,
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