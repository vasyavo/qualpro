var $ = require('jQuery');
var _ = require('underscore');
var Backbone = require('backbone');
var parrent = require('../parrent');
var Model = require('../../models/promotions');
var CONTENT_TYPES = require('../../constants/contentType');

module.exports = parrent.extend({
    model      : Model,
    url        : CONTENT_TYPES.PROMOTIONS,
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
