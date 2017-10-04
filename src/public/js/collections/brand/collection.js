var Parent = require('../parrent');
var Model = require('../../models/brand');
var CONTENT_TYPES = require('../../constants/contentType');

module.exports = Parent.extend({
    model      : Model,
    url        : CONTENT_TYPES.BRAND,
    viewType   : null,
    contentType: CONTENT_TYPES.BRAND,

    initialize: function (options) {
        var page;

        options = options || {};
        page = options.page;
        options.reset = true;

        this.getPage(page, options);
    }
});
