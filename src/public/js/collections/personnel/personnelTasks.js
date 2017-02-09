define([
        'backbone',
        'jQuery',
        'Underscore',
        'collections/parrent',
        'models/objectives',
        'models/inStoreTasks',
        'constants/otherConstants',
        'async',
        'custom',
        'constants/contentType'
    ],
    function (Backbone, $, _,
              Parent, ObjectivesModel, InStoreModel,
              OTHER_CONSTANTS, async, custom, CONTENT_TYPES) {
        'use strict';
        var models;
        var Collection;

        function buildModelsObject() {
            var resObject = {};

            resObject[CONTENT_TYPES.OBJECTIVES] = ObjectivesModel;
            resObject[CONTENT_TYPES.INSTORETASKS] = InStoreModel;

            return resObject;
        }

        models = buildModelsObject();

        Collection = Parent.extend({
            url        : 'personnel/personnelTasks',
            viewType   : null,
            contentType: null,

            modelId: function (attributes) {
                return attributes._id;
            },

            model: function (attributes, options) {
                options.parse = true;

                return new models[attributes.context || 'objectives'](attributes, options);
            },

            initialize: function (options) {
                var page;

                options = options || {};
                page = options.page;
                options.reset = true;

                if (options.url) {
                    this.url = options.url;

                    delete options.url;
                }

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
                    $or: {
                        type  : 'collection',
                        values: [
                            {assignedTo: filterId},
                            {'createdBy.user': filterId}
                        ]
                    },

                    status: {
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

