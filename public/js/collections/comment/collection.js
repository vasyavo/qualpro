define([
    'collections/parrent',
    'models/comment',
    'constants/contentType'
], function (Parrent, Model, CONTENT_TYPES) {
    var Collection = Parrent.extend({
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
    return Collection;
});
