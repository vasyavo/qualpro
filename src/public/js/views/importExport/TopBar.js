var $ = require('jquery');
var _ = require('underscore');
var Marionette = require('backbone.marionette');
var Template = require('../../../templates/importExport/top-bar.html');

module.exports = Marionette.View.extend({

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
    },

    changeTranslatedFields: function (translation) {
        var that = this;
        var $elementsForTranslation = this.$el.find('[data-translation]');

        this.translation = translation;
        $elementsForTranslation.each(function (index, el) {
            var $element = $(el);
            var property = $element.attr('data-translation');

            $element.html(that.translation[property]);
        });
    },

});
