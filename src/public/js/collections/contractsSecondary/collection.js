var Parent = require('../parrent');
var Model = require('../../models/contractsSecondary');
var CONTENT_TYPES = require('../../constants/contentType');

module.exports = Parent.extend({
    model      : Model,
    url        : CONTENT_TYPES.CONTRACTSSECONDARY,
    viewType   : null,
    contentType: null,

    initialize: function (options) {
        var page;

        options = options || {};
        page = options.page;

        options.reset = true;

        this.getPage(page, options);
    }
});
