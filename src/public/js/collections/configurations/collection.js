var Parent = require('../parrent');
var Model = require('../../models/configuration');

module.exports = Parent.extend({
    model      : Model,
    viewType   : null,
    contentType: null,

    url: function () {
        return '/retailSegment/forConfigs?arrayOfId=' + this.retailSegmentId;
    },

    initialize: function () {

    },

    fetchFromRetailSegmentId: function (retailSegmentId) {
        this.retailSegmentId = retailSegmentId;
        this.fetch({reset: true});
    },

    parse: function (response) {
        return response.configurations.map(function(item) {
            return {
                _id : item._id,
                name: item.configuration
            }
        });
    }
});
