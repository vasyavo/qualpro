var parrent = require('../parrent');
var Model = require('../../models/promotionsItems');
var CONTENT_TYPES = require('../../constants/contentType');

module.exports = parrent.extend({
    model      : Model,
    url        : CONTENT_TYPES.PROMOTIONSITEMS,
    viewType   : null,
    contentType: null,

    initialize: function (options) {
        var page;

        options = options || {};
        page = options.page;
        options.reset = true;


        this.getPage(page, options);
    },

    parse: function (response) {
        this.totalRecords = response.total;
        this.itemCount = response.count; //itemCount;
        this.itemsNumber = this.pageSize;

        return response.data;
    }
});
