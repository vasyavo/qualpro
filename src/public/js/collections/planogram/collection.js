var Parrent = require('../parrent');
var Model = require('../../models/planogram');
var CONTENT_TYPES = require('../../constants/contentType');

module.exports = Parrent.extend({
    model      : Model,
    url        : CONTENT_TYPES.PLANOGRAM,
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
