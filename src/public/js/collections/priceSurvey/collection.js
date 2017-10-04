var parrent = require('../parrent');
var Model = require('../../models/priceSurvey');
var contentType = require('../../constants/contentType');

module.exports = parrent.extend({
    model      : Model,
    contentType: contentType.PRICESURVEY,
    pageSize   : 4,
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
