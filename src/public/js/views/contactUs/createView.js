'use strict';
define([
    'Backbone',
    'Underscore',
    'jQuery',
    'constants/contentType',
    'text!templates/contactUs/create.html',
    'text!templates/file/preView.html',
    'views/baseDialog',
    'views/objectives/fileDialogView',
    'views/personnel/listForSelection',
    'models/contactUs',
    'populate',
    'collections/file/collection',
    'models/file',
    'collections/category/collection',
    'collections/displayType/collection',
    'models/country',
    'models/region',
    'models/subRegion',
    'models/retailSegment',
    'models/outlet',
    'models/branch',
    'helpers/implementShowHideArabicInputIn',
    'views/filter/dropDownView',
    'constants/otherConstants',
    'moment',
    'dataService',
    'validation',
    'constants/errorMessages'
], function (Backbone, _, $, CONTENT_TYPES, CreateTemplate, FileTemplate, BaseView, FileDialogView, PersonnelListForSelectionView,
             Model, populate, FileCollection, FileModel, CategoryCollection, DisplayTypeCollection,
             CountryModel, RegionModel, SubRegionModel, RetailSegmentModel, OutletModel, BranchModel,
             implementShowHideArabicInputIn, DropDownView, CONSTANTS, moment, dataService, validation,
             ERROR_MESSAGES) {

    var CreateView = BaseView.extend({
        contentType          : CONTENT_TYPES.CONTACT_US,
        template             : _.template(CreateTemplate),
        fileTemplate         : _.template(FileTemplate),
        imageSrc             : '',
        ALLOWED_CONTENT_TYPES: _.union(CONSTANTS.IMAGE_CONTENT_TYPES, CONSTANTS.MS_WORD_CONTENT_TYPES, CONSTANTS.MS_EXCEL_CONTENT_TYPES, CONSTANTS.OTHER_FORMATS, CONSTANTS.VIDEO_CONTENT_TYPES),

        events: {
            'click #assignDd'  : 'showPersonnelView',
            'click #attachFile': 'showAttachDialog'
        },

        initialize: function (options) {
            this.translation = options.translation;
            this.files = new FileCollection();
            this.model = new Model();
            this.locationFilter = {};
            this.makeRender();
            this.render();

            _.bindAll(this, 'fileSelected');
        },

        checkValue: function (key, attr, date) {
            var $curEl = this.$el;
            var el = attr ? $curEl.find('#' + key + 'Dd') : $curEl.find('#' + key);
            var value = attr ? el.attr('data-id') : el.val();

            if (date && value) {
                value = moment(value, 'DD.MM.YYYY, h:mm:ss');
                value = key === 'dateStart' ? value.set('hour', 0).set('minute', 1) : value.set('hour', 23).set('minute', 59);
            }
            this.body[key] = value;
        },

        savePromotion: function (options, cb) {
            var model = new Model();
            var $curEl = this.$el;
            var self = this;
            var attachments;
            var description = {
                en: $curEl.find('.objectivesTextarea[data-property="en"]').val(),
                ar: $curEl.find('.objectivesTextarea[data-property="ar"]').val()
            };

            var arrForVal = ['title', 'dateStart', 'dateEnd'];
            var arrForDate = ['dateStart', 'dateEnd'];
            var keys = _.union(['type'], arrForVal);
            this.checkForEmptyInput(this.files, this.$el);

            this.body = {};
            attachments = this.files;

            keys.forEach(function (key) {
                var attr = _.indexOf(arrForVal, key) === -1;
                var date = _.indexOf(arrForDate, key) !== -1;
                self.checkValue(key, attr, date);
            });

            if (this.linkedForm) {
                this.body.formType = this.linkedForm._id;
            }

            this.body.description = description;

            this.body.savePromotion = !!options.save;

            this.body.attachments = attachments.length ? attachments : null;

            model.setFieldsNames(this.translation);

            model.validate(this.body, function (err) {
                if (err && err.length) {
                    App.renderErrors(err);
                } else {
                    self.$el.find('#mainForm').submit();
                    cb();
                }
            });
        },

        formSubmit: function (e) {
            var context = e.data.context;
            var data = new FormData(this);

            e.preventDefault();
            data.append('data', JSON.stringify(context.body));
debugger;
            $.ajax({
                url        : context.model.urlRoot(),
                type       : 'POST',
                data       : data,
                contentType: false,
                processData: false,
                success    : function (xhr) {
                    var model = new Model(xhr, {parse: true});

                    context.trigger('modelSaved', model);
                }
            });
        },

        showAttachDialog: function () {
            this.fileDialogView = new FileDialogView({
                files      : this.files,
                contentType: this.contentType,
                dialogTitle: this.translation.attachments,
                buttonName : this.translation.attachBtn,
                translation: this.translation
            });

            this.fileDialogView.on('clickAttachFileButton', this.attachFile, this);
            this.fileDialogView.on('removeFile', this.removeFile, this);
        },

        removeFile: function (file) {
            var $thumbnail = this.$el.find('.fileThumbnailItem[data-id = "' + file.cid + '"]');

            $thumbnail.remove();
            this.files.remove(file, {silent: true});
            this.$el.find('#' + file.cid).remove();
        },

        fileSelected: function (e) {
            var self = this;
            var data = e.data;
            var $fileInput = $(data.fileInput);
            var fileCid = $fileInput.attr('id');
            var fileModel = this.files.get(fileCid);
            var currentLanguage = (App.currentUser && App.currentUser.currentLanguage) ? App.currentUser.currentLanguage : 'en';

            var reader = new FileReader();

            reader.readAsDataURL(e.target.files[0]);

            reader.onload = function (el) {
                var result = el.target.result;
                var selectedFile;
                var type;
                var model;
                if (!result) {
                    self.files.remove(fileModel);
                }
                type = $fileInput.prop('files')[0].type;

                if (self.ALLOWED_CONTENT_TYPES.indexOf(type) === -1) {
                    App.render({type: 'error', message: ERROR_MESSAGES.forbiddenTypeOfFile[currentLanguage]});
                    return;
                }

                selectedFile = {
                    name: $fileInput.prop('files')[0].name,
                    type: type
                };

                fileModel.update({
                    file    : selectedFile,
                    selected: true,
                    uploaded: true
                });

                if (fileModel.getTypeFromContentType(type) === 'image_icon') {
                    fileModel.set({preview: result});
                }

                model = fileModel.toJSON();
                model.cid = fileCid;


                self.$el.find('#fileThumbnail').append(self.fileTemplate({
                    model: model
                }));

                self.$el.find('#filesBlock').show();
                self.fileDialogView.trigger('fileSelected', fileModel);
                App.masonryGrid.call(self.$el);
            };

        },

        attachFile: function () {
            var fileInput;
            var fileModel = new FileModel();

            this.files.add(fileModel);
            this.$el.find('#mainForm').append('<input accept="' + this.ALLOWED_CONTENT_TYPES.join(', ') + '" type="file" name="' + fileModel.cid + '" id="' + fileModel.cid + '" style="display: none">');
            fileInput = this.$el.find('#' + fileModel.cid);
            fileInput.on('change', {fileInput: fileInput}, this.fileSelected);
            fileInput.click();
        },

        render: function () {
            var anotherLanguage = App.currentUser.currentLanguage === 'en' ? 'Ar' : 'En';
            var idToHide = 'description' + anotherLanguage + 'Container';
            var jsonModel = this.model.toJSON();
            var formString = this.template({
                jsonModel  : jsonModel,
                translation: this.translation
            });
            var self = this;
            var dateStart = new Date();
            var endDate;
            var $startDate;
            var $dueDate;
            var $curEl;

            this.$el = $(formString).dialog({
                dialogClass: 'create-dialog full-height-dialog',
                width      : '1000',
                buttons    : {
                    save: {
                        text : self.translation.saveBtn,
                        class: 'btn saveBtn',
                        click: function () {
                            var that = this;

                            self.savePromotion({save: true}, function () {
                                $(that).dialog('destroy').remove();
                            });
                        }
                    },

                    send: {
                        text : self.translation.publishBtn,
                        class: 'btn sendBtn',
                        click: function () {
                            var that = this;

                            self.savePromotion({save: false}, function () {
                                $(that).dialog('destroy').remove();
                            });
                        }
                    }
                }
            });

            $curEl = this.$el;

            $startDate = $curEl.find('#dateStart');
            $dueDate = $curEl.find('#dateEnd');

            $curEl.find('#' + idToHide).hide();
            $curEl.find('#filesBlock').hide();
            $curEl.find('#mainForm').on('submit', {body: this.body, context: this}, this.formSubmit);

            $startDate.datepicker({
                changeMonth: true,
                changeYear : true,
                yearRange  : '-100y:c+nn',
                minDate    : new Date(dateStart),
                maxDate    : new Date(endDate),
                defaultDate: new Date(dateStart),
                onClose    : function (selectedDate) {
                    $dueDate.datepicker('option', 'minDate', selectedDate);
                }
            });

            $dueDate.datepicker({
                changeMonth: true,
                changeYear : true,
                yearRange  : '-100y:c+nn',
                minDate    : new Date(dateStart),
                maxDate    : new Date(endDate),
                defaultDate: new Date(endDate),
                onClose    : function (selectedDate) {
                    $startDate.datepicker('option', 'maxDate', selectedDate);
                }
            });

            implementShowHideArabicInputIn(this);

            populate.inputDropDown({
                selector   : '#typeDd',
                context    : this,
                contentType: 'type',
                displayText: this.translation.type,
                collection : CONSTANTS.CONTACT_US_TYPES,
                forPosition: true
            });

            this.$el.find('.objectivesTextarea').each(function (index, element) {
                var $element = $(element);

                $element.ckeditor({language: $element.attr('data-property')});
            });

            this.delegateEvents(this.events);

            return this;
        }
    });

    return CreateView;
});
