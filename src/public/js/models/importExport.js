var Backbone = require('backbone');

module.exports = Backbone.Model.extend({

    defaults: {
        action: 'import',
    },

    exportData: function (contentType) {
        window.open(window.location.origin + '/export/' + contentType);
    }

});
