define(function (require) {

    var Marionette = require('marionette');
    var Template = require('text!../../../templates/importExport/overview.html');

    return Marionette.View.extend({

        className: 'row import-buttons',

        template: function () {
            return Template;
        }

    });

});
