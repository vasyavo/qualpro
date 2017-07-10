define(function(require) {
    var Parent = require('collections/parrent');
    var Model = require('models/configuration');
    var CONTENT_TYPES = require('constants/contentType');

    var Collection = Parent.extend({
        model      : Model,
        viewType   : null,
        contentType: null,

        url: function () {
            return `/retailSegment/forConfigs?arrayOfId=${this.retailSegmentId}`;
        },

        initialize: function () {

        },

        fetchFromRetailSegmentId: function (retailSegmentId) {
            this.retailSegmentId = retailSegmentId;
            this.fetch({reset: true});
        },

        parse: function (response) {
            return response.configurations.map((item) => {
                return {
                    _id : item._id,
                    name: item.configuration
                }
            });
        }
    });

    return Collection;
});
