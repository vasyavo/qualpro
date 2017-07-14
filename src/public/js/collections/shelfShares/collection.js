var Parent = require('../parrent');
var Model = require('../../models/shelfShares');
var CONTENT_TYPES = require('../../constants/contentType');

module.exports = Parent.extend({
    model      : Model,
    contentType: CONTENT_TYPES.SHELFSHARES,
    url        : function () {
        return '/' + this.contentType;
    },

    initialize: function (options) {
        var page;

        options = options || {};
        page = options.page;
        options.reset = true;

        this.getPage(page, options);
    }
});
