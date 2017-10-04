var Parent = require('../parrent');
var Model = require('../../models/competitorsList');

module.exports = Parent.extend({
    model      : Model,
    url        : '/competitorList/',
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
