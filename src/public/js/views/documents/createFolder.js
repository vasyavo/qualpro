define(function (require) {

    var Marionette = require('marionette');
    var Template = require('text!templates/documents/create-file.html');

    return Marionette.View.extend({

        template : function () {
            return Template;
        }

    });

});
