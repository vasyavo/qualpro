var Parent = require('../parrent');
var Model = require('../../models/displayType');
var CONTENT_TYPES = require('../../constants/contentType');

module.exports = Parent.extend({
    model      : Model,
    url        : CONTENT_TYPES.DISPLAYTYPE,
    viewType   : null,
    contentType: CONTENT_TYPES.DISPLAYTYPE,
    sortOrder  : 1,

    initialize: function (options) {
        var page;

        options = options || {};
        page = options.page;
        options.reset = true;

        this.getPage(page, options);
    },

    comparator: '_id'
});
