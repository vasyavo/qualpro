var Parent = require('../parrent');
var Model = require('../../models/marketingCampaign');
var CONTENT_TYPES = require('../../constants/contentType');

module.exports = Parent.extend({
    model      : Model,
    url        : CONTENT_TYPES.MARKETING_CAMPAIGN,
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
