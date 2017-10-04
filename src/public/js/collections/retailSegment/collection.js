var Parent = require('../parrent');
var Model = require('../../models/retailSegment');
var CONTENT_TYPES = require('../../constants/contentType');

module.exports = Parent.extend({
    model      : Model,
    url        : CONTENT_TYPES.RETAILSEGMENT,
    viewType   : null,
    contentType: CONTENT_TYPES.RETAILSEGMENT,

    initialize: function (options) {
        var page;

        options = options || {};
        page = options.page;
        options.reset = true;

        this.subRegionId = options.subRegion;

        if (options.create !== false) {
            this.getPage(page, options);
        }
    }
});