define([
        'Backbone',
        'jQuery',
        'Underscore',
        'collections/parrent',
        'models/inStoreTasks',
        'constants/otherConstants',
        'constants/contentType'
    ],
    function (Backbone, $, _, Parent, Model, OTHER_CONSTANTS, CONTENT_TYPES) {
        var Collection = Parent.extend({
            model      : Model,
            url        : CONTENT_TYPES.INSTORETASKS,
            viewType   : null,
            contentType: null,

            initialize: function (options) {
                var page;

                options = options || {};
                page = options.page;
                options.reset = true;

                if ($.isEmptyObject(options.filter)) {
                    this.filterInitialize(options);
                }

                this.getPage(page, options);
            },

            filterInitialize: function (options) {
                var OBJECTIVE_STATUSES = OTHER_CONSTANTS.OBJECTIVE_STATUSES;

                var id = App.currentUser._id;
                var filterId = {
                    type  : 'ObjectId',
                    values: [id]
                };

                var filter = {
                    '$or'   : {
                        type  : 'collection',
                        values: [
                            {'assignedTo': filterId},
                            {'createdBy.user': filterId}
                        ]
                    },
                    'status': {
                        type   : 'string',
                        values : [OBJECTIVE_STATUSES.CLOSED],
                        options: {$nin: true}
                    }
                };

                options.filter = filter;
            }
        });

        return Collection;
    });