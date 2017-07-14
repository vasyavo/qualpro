var Parent = require('../parrent');
var Model = require('../../models/competitorVariant');
var CONTENT_TYPES = require('../../constants/contentType');

module.exports = Parent.extend({
    model      : Model,
    url        : CONTENT_TYPES.COMPETITORVARIANT,
    viewType   : null,
    contentType: CONTENT_TYPES.COMPETITORVARIANT,

    initialize: function (options) {
        var page;

        options = options || {};
        page = options.page;
        options.reset = true;

        this.getPage(page, options);
    }
});
