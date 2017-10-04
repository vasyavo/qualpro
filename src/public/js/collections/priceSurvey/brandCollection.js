var parrent = require('../parrent');
var Model = require('../../models/shelfSharesBrand');
var contentType = require('../../constants/contentType');

module.exports = parrent.extend({
    model      : Model,
    contentType: contentType.PRICESURVEY,

    url: function () {
        return '/' + this.contentType + '/brands';
    },

    initialize: function (options) {
        var page;

        options = options || {};
        page = options.page;
        options.reset = true;

        if (options.fetch === true) {
            this.getPage(page, options);
        }
    }
});
