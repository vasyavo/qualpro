var Parent = require('../parrent');
var Model = require('../../models/subRegion');
var CONTENT_TYPES = require('../../constants/contentType');

module.exports = Parent.extend({
    model      : Model,
    url        : CONTENT_TYPES.SUBREGION,
    viewType   : null,
    contentType: CONTENT_TYPES.SUBREGION,

    initialize: function (options) {
        var page;

        this.parentCT = CONTENT_TYPES.REGION;

        options = options || {};
        page = options.page;
        options.reset = true;
        options.parentCT = this.parentCT;

        this.parentId = options.parent;

        if (options.create !== false) {
            this.getPage(page, options);
        }
    }
});
