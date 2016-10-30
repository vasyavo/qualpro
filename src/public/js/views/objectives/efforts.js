define([
    'jQuery',
    'Underscore',
    'common',
    'text!templates/objectives/efforts/efforts.html',
    'models/personnel',
    'views/baseDialog',
    'constants/errorMessages'
], function ($, _, common, Template, Model, BaseView, ERROR_MESSAGES) {
    'use strict';

    var manageView = BaseView.extend({
        contentType: 'Efforts',

        template: _.template(Template),

        errors: {},

        events: {},

        initialize: function (options) {
            var self = this;
            this.translation = options.translation;
            this.contentType = options.contentType;
            this.options = options;
            this.persons = options.model.attributes.assignedTo;
            this.persons.forEach(function (person, key) {
                var model = new Model({_id: person._id});
                model.fetch();
                model.on('change', self.addPositions, this);
                self.modelOnChangeContext = this;
                self.persons[key].position = model.attributes.position;
            });
            this.makeRender();
            this.render();
        },

        addPositions: function (e) {
            var id = this.id;
            var tabSpan = '#' + id + 'Tab';
            var editField = '#' + id + 'EditEffort';
            var $editField = $(editField);

            $(tabSpan).append('<p class="blueText">' + this.attributes.position.name.en + '</p>');

            $editField.inputmask('999%', {
                autoUnmask : true,
                placeholder: ''
            });
            $editField.attr('data-inputmask-clearmaskonlostfocus', false);
            $editField.attr('data-masked', true);
            this.off('change');
        },

        formSend: function (e) {
            var currentLanguage = App.currentUser.currentLanguage;
            var self = this;
            var $curEl = this.$el;
            var data = {
                efforts: []
            };
            var $edits;
            var url;
            var id;
            var saveData;

            $edits = $('.effortInput');
            id = $('.tableRow')[0].id;
            $.each($edits, function (i, item) {
                item.value = +item.value || 0;
                if (item.value < 0) {
                    item.value = 0;
                } else if (item.value > 100) {
                    item.value = 100;
                }

                data.efforts.push({
                    effort: item.value,
                    person: item.id.substr(0, 24)
                });
                data.status = 'closed';
            });

            saveData = data;
            data = JSON.stringify(data);
            data = {changed: data};
            url = this.contentType + '/' + id;

            $.ajax({
                url     : url,
                type    : 'PATCH',
                data    : data,
                dataType: 'json',
                success : function () {
                    self.renderEfforts(saveData, self.options.$objectivesPreview);
                    self.undelegateEvents();
                    self.off('change');
                    self.off(null, self.addPositions);
                    $curEl.off('change');
                    $curEl.dialog('destroy');
                    App.render({type: 'notification', message: ERROR_MESSAGES.successfullySaved[currentLanguage]});
                },
                error   : function () {
                    App.render({type: 'error', message: ERROR_MESSAGES.ajaxPostError[currentLanguage]});
                    self.undelegateEvents();
                    self.off('change');
                    self.off(null, self.addPositions);
                    $curEl.off('change');
                    $curEl.dialog('destroy');
                }
            });

        },

        renderEfforts: function (data, el) {
            var self = this;
            var effortsHTML = '';

            if (data.efforts) {

                this.model.attributes.assignedTo.forEach(function (item, i, arr) {
                    var id = item._id;
                    var idd;
                    var lengthEfforts = data.efforts.length;
                    var color = 'textOrange';

                    effortsHTML += '<a>' + item.firstName.currentLanguage + ' ' + item.lastName.currentLanguage;
                    for (var i = 0; i < lengthEfforts; i++) {
                        idd = data.efforts[i].person;
                        if (idd === id) {
                            effortsHTML += '<span class="' + color + '">Achieved ' + data.efforts[i].effort + '%</span>';
                        }
                    }
                    effortsHTML += '</a>';
                });
                el.find('#assignTo').html(effortsHTML);
            }

        },

        saveData: function () {
            this.formSend();
        },

        render: function () {
            var $formString = $(this.template({
                options    : this.options,
                translation: this.translation
            }));
            var self = this;

            this.$el = $formString.dialog({
                width        : '380px',
                dialogClass  : 'create-dialog',
                showCancelBtn: false,
                title        : 'Efforts',
                options      : this.options,
                buttons      : {
                    save: {
                        text : 'OK',
                        click: function () {
                            self.saveData();
                        }
                    }
                }
            });
            this.delegateEvents(this.events);
            return this;
        }
    });

    return manageView;
});
