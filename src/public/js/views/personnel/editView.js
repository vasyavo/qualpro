'use strict';

define([
    'Backbone',
    'Underscore',
    'jQuery',
    'text!templates/personnel/edit.html',
    'views/baseDialog',
    'models/personnel',
    'populate',
    'common',
    'helpers/implementShowHideArabicInputIn',
    'helpers/createPersonnelViewLogic',
    'views/personnel/listForSelection',
    'moment'
], function (Backbone, _, $, template, BaseView, personnelModel, populate, common, implementShowHideArabicInputIn,
             createPersonnelViewLogic, ListForSelection, moment) {
    var EditView = BaseView.extend({
        contentType   : 'personnel',
        imageSrc      : '',
        template      : _.template(template),
        $errrorHandler: null,

        initialize: function (options) {
            _.bindAll(this, 'render', 'saveItem');
debugger;
            this.logic = createPersonnelViewLogic(this);
            this.currentModel = options.model;
            this.responseObj = {};

            this.translation = options.translation;
            this.CoverPreview = options.CoverPreview;

            _.bindAll(this, 'beforeClose');

            this.makeRender();
            this.render();
        },

        events: {
            /* 'mouseenter .avatar': 'showEdit',
             'mouseleave .avatar': 'hideEdit',*/
            'click .domainDialogExecutor': 'showDomainDialog',
            'click .currentSelected'     : 'showNewSelect',
            'click'                      : 'hideNewSelect',
            'click .newSelectList'       : 'chooseOption',
            'click .coverDialogExecutor' : 'showCoverDialog',
            'click #onLeaveCheckbox'     : 'toggleCover',
            'click #coveredName'         : 'openCoverPreview'
        },

        hideDialog: function () {
            $('.edit-dialog').remove();
            $('.add-group-dialog').remove();
            $('.add-user-dialog').remove();
            $('.crop-images-dialog').remove();
        },

        openCoverPreview: function (e) {
            var id = $(e.target).attr('data-id');
            var self = this;

            this.coverPreview = new this.CoverPreview({
                id         : id,
                translation: this.translation,
                hideButtons: true
            });

            this.coverPreview.on('saveModel', function () {
                self.saveItem(function () {
                    self.coverPreview.trigger('redirectForFind');
                });
            });
        },

        saveItem: function (cb) {
            this.logic.getDataFromHtmlAndSaveModel(this.currentModel, this.imageSrc, this.translation, cb);
        },

        accessRoleSelected: function (opts) {
            var model = opts.model;

            this.logic.showDomainsRows(model.level);
        },

        dropDownSelected: function (opts) {
            if (opts.contentType === 'accessRole') {
                this.accessRoleSelected(opts);
            }
        },

        showDomainDialog: function (e) {
            var domainType = $(e.target).attr('data-value');

            this.logic.showDomainDialog(domainType);
        },

        showCoverDialog: function (e) {
            var $coveredName = this.$el.find('#coveredName');
            var listForSelection = new ListForSelection({
                translation       : this.translation,
                parrentContentType: this.contentType,
                personnelToOnLeave: this.currentModel
            });

            listForSelection.on('coverSaved', function (personnelsCollection) {
                var cover = personnelsCollection.at(0);

                $coveredName.removeClass('hidden');
                $coveredName.attr('data-id', cover.get('_id'));
                $coveredName.html(cover.get('fullName'));
            });
        },

        toggleCover: function (e) {
            e.stopPropagation();

            this.$el.find('.coverField').toggle();
        },

        beforeClose: function () {
            this.logic.resetContentTypes();
        },

        render: function () {
            var anotherLanguage = App.currentUser.currentLanguage === 'en' ? 'Ar' : 'En';
            var firstNameIdToHide = 'firstName' + anotherLanguage;
            var lastNameIdToHide = 'lastName' + anotherLanguage;
            var self = this;
            var currentUser = App.currentUser;
            var model = this.model;
            var formString = this.template({
                currentUser: currentUser,
                model      : model.toJSON(),
                translation: this.translation
            });

            var $formString = $(formString);
            var $phoneField;
            var $curEl;
            var currentUserAccessRoleLevel;
            var tempEmployee = model.get('temp');

            if (!tempEmployee) {
                currentUserAccessRoleLevel = model.get('accessRole').level;
            }

            if (!model.get('super')) {
                this.logic.cacheDomainFields($formString);
                this.logic.setDomainDataToHtmlFromModel(this.currentModel);
            }

            this.$el = $formString.dialog({
                dialogClass: 'edit-dialog',
                title      : this.translation.editPersonnel,
                buttons    : {
                    save  : {
                        text : this.translation.saveBtn,
                        class: 'btn',
                        click: function () {
                            var that = this;
                            self.saveItem(function () {
                                $(that).dialog('destroy').remove();
                            })
                        }
                    },
                    cancel: {
                        text: this.translation.cancelBtn
                    }
                }
            });

            this.$el.dialog({
                beforeClose: this.beforeClose
            });

            $curEl = this.$el;

            $curEl.find('#' + firstNameIdToHide).hide();
            $curEl.find('#' + lastNameIdToHide).hide();

            $phoneField = $curEl.find('#phone');
            $phoneField.inputmask('+999(99)-999-9999');
            $phoneField.attr('data-inputmask-clearmaskonlostfocus', false);
            $phoneField.attr('data-masked', true);

            if (!tempEmployee) {
                populate.inputDropDown({
                    selector    : '#accessRoleDd',
                    context     : this,
                    contentType : 'accessRole',
                    displayModel: model.get('accessRole')
                });

                this.on('changeItem', this.dropDownSelected, this);

                populate.inputDropDown({
                    selector    : '#positionDd',
                    context     : this,
                    contentType : 'position',
                    displayModel: model.get('position')
                });

                this.$el.find('#dateJoined').datepicker({
                    changeMonth: true,
                    changeYear : true,
                    maxDate    : new Date(),
                    defaultDate: new Date(moment(model.get('dateJoined'), 'DD.MM.YYYY')),
                    yearRange  : '-20y:c+10y'
                });

                this.logic.showDomainsRows(currentUserAccessRoleLevel);
            }

            if (!tempEmployee) {
                common.canvasDraw({
                    model      : model.toJSON(),
                    translation: this.translation
                }, this);
            }

            implementShowHideArabicInputIn(this);

            this.$errrorHandler = $('#errorHandler');

            this.delegateEvents(this.events);

            return this;
        }
    });
    return EditView;
});
