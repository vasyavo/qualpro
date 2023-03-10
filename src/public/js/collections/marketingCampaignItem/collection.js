var Parent = require('../parrent');
var Model = require('../../models/marketingCampaignItem');
var CONTENT_TYPES = require('../../constants/contentType');

module.exports = Parent.extend({
    model      : Model,
    url        : CONTENT_TYPES.MARKETING_CAMPAIGN_ITEM,
    viewType   : null,
    contentType: null,

    initialize: function (options) {
        var page;

        options = options || {};
        page = options.page;
        options.reset = true;

        if (options.fetch) {
            this.getPage(page, options);
        }
    },

    parse: function (response) {
        this.totalRecords = response.total;
        this.itemCount = response.count;
        this.itemsNumber = this.pageSize;

        return response.data;
    }
});
