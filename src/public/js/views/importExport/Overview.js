define(function (require) {

    var Marionette = require('marionette');
    var Template = require('text!../../../templates/importExport/overview.html');

    return Marionette.View.extend({

        template: function () {
            return Template;
        }

    });

});
