var Parent = require('../parrent');
var Model = require('../../models/activityList');
var CONTENT_TYPES = require('../../constants/contentType');

module.exports = Parent.extend({
    model      : Model,
    url        : CONTENT_TYPES.ACTIVITYLIST,
    viewType   : null,
    contentType: null,

    initialize: function (options) {
        var page;

        options = options || {};
        page = options.page;

        if (!options.hasOwnProperty('reset')) {
            options.reset = true;
        }

        if (!options.hasOwnProperty('fetch')) {
            options.fetch = true;
        }

        if (options.fetch) {
            this.getPage(page, options);
        }
    }
});
