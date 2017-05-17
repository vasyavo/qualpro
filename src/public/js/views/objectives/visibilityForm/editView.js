define(function (require) {

    var $ = require('jquery');
    var _ = require('underscore');
    var Backbone = require('backbone');
    var CONSTANTS = require('constants/otherConstants');
    var Template = require('text!templates/objectives/visibilityForm/edit.html');

    return Backbone.View.extend({

        initialize: function (options) {
            this.translation = options.translation;

            this.templateOptions = {
                translation: this.translation,
                description: options.description,
                locationString: options.locationString,
                outlets: options.outlets,
                allowed : CONSTANTS.IMAGE_CONTENT_TYPES.concat(CONSTANTS.VIDEO_CONTENT_TYPES).join(', ')
            };

            this.render();
        },

        template: _.template(Template),

        save: function () {

        },

        render: function () {
            var that = this;
            var layout = this.template(this.templateOptions);

            that.$el = $(layout).dialog({
                width : 'auto',
                dialogClass : 'edit-dialog visibilityFormHeight',
                buttons : {
                    save : {
                        text : that.translation.saveBtn,
                        click : that.save.bind(that),
                    },
                }
            });

            this.delegateEvents(this.events);
        }

    });

});
