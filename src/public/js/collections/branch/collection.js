var Parent = require('../parrent');
var Model = require('../../models/branch');
var CONTENT_TYPES = require('../../constants/contentType');

module.exports = Parent.extend({
    model      : Model,
    url        : CONTENT_TYPES.BRANCH,
    viewType   : null,
    contentType: CONTENT_TYPES.BRANCH,

    initialize: function (options) {
        var page;

        options = options || {};
        page = options.page;
        options.reset = true;

        this.subRegion = options.subRegion;
        this.retailSegment = options.retailSegment;
        this.outlet = options.outlet;
        this.getPage(page, options);
    }
});
