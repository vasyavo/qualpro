var parent = require('./parrent');

module.exports = parent.extend({
    defaults   : {},
    idAttribute: '_id',

    initialize: function () {
        this.fetchAndReset();
    },

    urlRoot: function () {
        return '/modules';
    },

    fetchAndReset: function () {
        var self = this;

        this.fetch({
            success: function (model) {
                self.trigger('reset');
            },
            error  : function () {
            }
        });
    }
});
