var Parent = require('../parrent');
var Model = require('../../models/comment');
var CONTENT_TYPES = require('../../constants/contentType');

module.exports = Parent.extend({
    model      : Model,
    url        : CONTENT_TYPES.COMMENT,
    viewType   : null,
    contentType: CONTENT_TYPES.COMMENT,

    initialize: function (options) {
        var page;

        options = options || {};
        page = options.page;
        options.reset = true;
        if (options.data.withAttachments) {
            this.changeUrl(true);
            delete options.data.withAttachments;
        }

        this.getPage(page, options);
    },
    changeUrl : function (change) {
        this.url = change ? this.url + '/withAttachments' : 'comment';
    }
});
