define([
        'collections/parrent',
        'models/configuration',
        'constants/contentType'
    ],
    function (Parrent, Model, CONTENT_TYPES) {
        var Collection = Parrent.extend({
            model      : Model,
            viewType   : null,
            contentType: null,

            url: function () {
                return '/retailSegment/' + this.retailSegmentId;
            },

            initialize: function () {

            },

            fetchFromRetailSegmentId: function (retailSegmentId) {
                this.retailSegmentId = retailSegmentId;
                this.fetch({reset: true});
            },

            parse: function (response) {
                return _.map(response.configurations, function (item) {
                    return {
                        _id : item._id,
                        name: item.configuration
                    }
                });
            }
        });

        return Collection;
    });