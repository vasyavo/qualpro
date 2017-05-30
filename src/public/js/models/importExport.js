define(function (require) {

    var Backbone = require('backbone');

    return Backbone.Model.extend({

        defaults: {
            action: 'import',
        },

        exportData: function (contentType) {
            window.open(window.location.origin + '/export/' + contentType);
        }

    });

});
