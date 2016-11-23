define([
        'collections/parrent',
        'models/personnel',
        'constants/contentType'
    ],
    function (Parrent, Model, CONTENT_TYPES) {
        var Collection = Parrent.extend({
            model      : Model,
            url        : CONTENT_TYPES.PERSONNEL,
            viewType   : null,
            contentType: null,

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

            setOnlineStatusToUsers : function (data, onlineUsers) {
                return data.map((model) => {
                    if (onlineUsers.indexOf(model._id) > -1) {
                        model.online = true;
                    }
                    return model;
                });
            }
        });

        return Collection;
    });
