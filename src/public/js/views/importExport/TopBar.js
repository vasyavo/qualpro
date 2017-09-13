define(function (require) {

    var _ = require('underscore');
    var Marionette = require('marionette');
    var Template = require('text!templates/importExport/top-bar.html');

    return Marionette.View.extend({

        initialize: function (options) {
            this.translation = options.translation;
        },

        className: 'import-export-topbar',

        template: function (ops) {
            return _.template(Template)(ops);
        },

        templateContext: function () {
            return {
                translation: this.translation,
            };
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
