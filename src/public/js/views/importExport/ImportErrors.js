var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var Template = require('../../../templates/importExport/import-errors.html');

module.exports = Backbone.View.extend({

    initialize: function (options) {
        this.translation = options.translation;
        this.models = options.models;

        this.render();
    },

    template: _.template(Template),

    render: function () {
        var that = this;

        var layout = $(this.template({
            translation: this.translation,
            models: this.models,
        }));

        this.$el = layout.dialog({
            width : 'auto',
            dialogClass : 'create-dialog full-height-dialog',
        });
    }

});