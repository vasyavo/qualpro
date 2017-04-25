define(function (require) {

    var $ = require('jquery');
    var _ = require('underscore');
    var Backbone = require('backbone');
    var Template = require('text!templates/importExport/import-errors.html');

    return Backbone.View.extend({

        initialize: function (options) {
            this.translation = options.translation;

            this.render();
        },

        template: _.template(Template),

        render: function () {
            var that = this;

            var layout = $(this.template({
                translation: this.translation,
            }));

            this.$el = layout.dialog({
                width : 'auto',
                dialogClass : 'create-dialog full-height-dialog',
            });
        }

    });

});