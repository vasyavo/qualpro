define(function (require) {

    var Marionette = require('marionette');
    var Template = require('text!../../../templates/importExport/top-bar.html');

    return Marionette.View.extend({

        template: function () {
            return Template;
        },

    });

});
