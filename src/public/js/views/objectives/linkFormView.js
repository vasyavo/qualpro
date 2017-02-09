define([
    'backbone',
    'Underscore',
    'jQuery',
    'text!templates/objectives/linkFormTemplate.html',
    'views/baseDialog',
    'populate',
    'constants/otherConstants',
    'constants/contentType'
], function (Backbone, _, $, FileDialogViewTemplate, BaseView, populate, CONSTANTS, CONTENT_TYPES) {

    var LinkFormView = BaseView.extend({
        contentType: CONTENT_TYPES.OBJECTIVES,
        forms      : CONSTANTS.OBJECTIVES_FORMS,

        template: _.template(FileDialogViewTemplate),

        events: {},

        initialize: function (options) {
            options = options || {};

            this.translation = options.translation;
            this.individualObjective = options.individual;
            this.dontShowDistributionForm = options.dontShowDistributionForm;
            this.assignedToCount = options.assignedToCount || 0;
            this.makeRender();
            this.render();
        },

        save: function () {
            var context = this.$el.find('#formDd').attr('data-id');
            var modelJSON;

            if (context === 'distribution') {
                modelJSON = this.forms[0];
            } else {
                modelJSON = this.forms[1];
            }

            this.trigger('formLinked', modelJSON);
        },

        render: function () {
            var $formString = $(this.template({
                translation: this.translation
            }));
            var colForDd = this.forms;
            var self = this;

            this.$el = $formString.dialog({
                dialogClass  : 'linkForm',
                title        : self.translation.linkForm,
                showCancelBtn: true,
                height       : '292',
                buttons      : {
                    save: {
                        text : self.translation.saveBtn,
                        click: function () {
                            self.save();

                            $(this).dialog('destroy').remove();
                        }
                    }
                }
            });

            if (this.assignedToCount > 1) {
                colForDd = colForDd[0];
            }

            if (this.individualObjective && this.dontShowDistributionForm) {
                colForDd = colForDd[1];
            }

            populate.inputDropDown({
                selector    : '#formDd',
                context     : this,
                contentType : 'form',
                displayModel: this.individualObjective ? colForDd[1] : colForDd[0],
                collection  : colForDd
            });

            this.delegateEvents(this.events);

            return this;
        }
    });

    return LinkFormView;
});

