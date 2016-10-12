define([
        'underscore',
        'collections/parrent',
        'models/country',
        'constants/contentType'
    ],
    function (_, Parrent, Model, CONTENT_TYPES) {
        var Collection = Parrent.extend({
            model      : Model,
            url        : CONTENT_TYPES.COUNTRY,
            viewType   : null,
            contentType: CONTENT_TYPES.COUNTRY,

            initialize: function (options) {
                var page;

                options = options || {};
                page = options.page;

                if (!options.hasOwnProperty('reset')) {
                    options.reset = true;
                }

                if (!options.hasOwnProperty('fetch')) {
                    options.fetch = true;
                }

                if (options.fetch) {
                    this.getPage(page, options);
                }
            },

            getSelected: function (options) {
                var selectedModels = this.where({selected: true});
                var jsonModels;

                options = options || [];
                jsonModels = _.invoke(selectedModels, 'toJSON');

                if (options.json) {
                    return jsonModels;
                }

                if (options.names) {
                    return _.pluck(jsonModels, 'name');
                }

                if (options.ids) {
                    return _.pluck(jsonModels, '_id');
                }

                return selectedModels;
            }
        });
        return Collection;
    });
