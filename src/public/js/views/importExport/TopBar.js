define(function (require) {

    var Marionette = require('marionette');
    var Template = require('text!../../../templates/importExport/top-bar.html');

    return Marionette.View.extend({

        className: 'import-export-topbar',

        template: function () {
            return Template;
        },

        ui: {
            radioInputs: 'input[type="radio"]',
        },

        events: {
            'change @ui.radioInputs': 'actionTypeChanged',
        },

        actionTypeChanged: function (event) {
            this.model.set('action', event.target.value);
            this.model.trigger('action:changed');
        }

    });

});
