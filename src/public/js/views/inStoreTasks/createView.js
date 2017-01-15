define([
    'Backbone',
    'Underscore',
    'jQuery',
    'text!templates/inStoreTasks/create.html',
    'text!templates/inStoreTasks/form/form.html',
    'text!templates/file/preView.html',
    'views/baseDialog',
    'views/objectives/fileDialogView',
    'views/personnel/listForSelection',
    'views/filter/treeView',
    'models/inStoreTasks',
    'populate',
    'collections/file/collection',
    'collections/filter/filterCollection',
    'models/file',
    'helpers/implementShowHideArabicInputIn',
    'constants/otherConstants',
    'moment',
    'views/visibilityForm/editView',
    'async',
    'constants/contentType',
    'constants/errorMessages'
], function (Backbone, _, $, CreateTemplate, FormTemplate, FileTemplate, BaseView,
             FileDialogView, PersonnelListForSelectionView, TreeView, Model,
             populate, FileCollection, FilterCollection, FileModel, implementShowHideArabicInputIn,
             CONSTANTS, moment, VisibilityEditView, async, CONTENT_TYPES, ERROR_MESSAGES) {

    var CreateView = BaseView.extend({
        contentType          : CONTENT_TYPES.INSTORETASKS,
        template             : _.template(CreateTemplate),
        formTemplate         : _.template(FormTemplate),
        fileTemplate         : _.template(FileTemplate),
        ALLOWED_CONTENT_TYPES: _.union(CONSTANTS.IMAGE_CONTENT_TYPES, CONSTANTS.MS_WORD_CONTENT_TYPES, CONSTANTS.MS_EXCEL_CONTENT_TYPES, CONSTANTS.OTHER_FORMATS, CONSTANTS.VIDEO_CONTENT_TYPES),

        locations: {
            country      : [],
            region       : [],
            subRegion    : [],
            retailSegment: [],
            outlet       : [],
            branch       : []
        },

        imageSrc: '',

        events: {
            'click #assignDd'            : 'showPersonnelView',
            'click #attachFile'          : 'showAttachDialog',
            'click #attachForm'          : 'linkVisibilityForm',
            'click #actionHolder:not(ul)': 'showHideActionDropdown',
            'click #formThumbnail'       : 'openForm',
            'click .fileThumbnailItem'   : 'showFilePreviewDialog'
        },

        initialize: function (options) {
            this.translation = options.translation;
            this.currentLanguage = App && App.currentUser && App.currentUser.currentLanguage ? App.currentUser.currentLanguage : 'en';
            this.files = new FileCollection();
            this.model = new Model();
            this.makeRender();
            this.render();

            _.bindAll(this, 'fileSelected');
        },

        showFilePreviewDialog: function () {
            var currentLanguage = App.currentUser.currentLanguage;
            App.render({type: 'alert', message: ERROR_MESSAGES.fileIsNotUploaded[currentLanguage]});
        },

        showLinkForm: function () {
            var $liEl = this.$el.find('#attachForm');

            $liEl.removeClass('hidden');
        },

        hideLinkForm: function () {
            var $liEl = this.$el.find('#attachForm');2

            $liEl.addClass('hidden');
        },

        openForm: function () {
            var description = {
                en: this.$el.find('.objectivesTextarea[data-property="en"]').val(),
                ar: this.$el.find('.objectivesTextarea[data-property="ar"]').val()
            };
            var self = this;

            this.visibilityForm = new VisibilityEditView({
                forCreate           : true,
                savedVisibilityModel: this.savedVisibilityModel,
                branchName          : this.branchesForVisibility.join(', '),
                description         : description,
                oldAjaxObj          : this.visibilityFormAjax,
                translation         : self.translation
            });
            this.visibilityForm.on('visibilityFormEdit', function (ajaxObj) {
                self.visibilityFormAjax = ajaxObj;
                self.savedVisibilityModel = ajaxObj.model;
            });

        },

        saveObjective: function (options, cb) {
            var self = this;
            var $curEl = this.$el;
            var startDate = $curEl.find('#dateStart').val();
            var endDate = $curEl.find('#dateEnd').val();
            this.checkForEmptyInput(this.files, this.$el);
            startDate = startDate ? moment(startDate, 'DD.MM.YYYY, h:mm:ss').set('hour', 0).set('minute', 1).toISOString() : '';
            endDate = endDate ? moment(endDate, 'DD.MM.YYYY, h:mm:ss').set('hour', 23).set('minute', 59).toISOString() : '';
            this.body = {
                title: {
                    en: $curEl.find('#titleEn').val(),
                    ar: $curEl.find('#titleAr').val()
                },

                objectiveType: CONSTANTS.OBJECTIVES_TYPE[4],
                assignedTo   : _.pluck(this.assignedTo, '_id'),
                saveObjective: options.save,
                priority     : $curEl.find('#priorityDd').attr('data-id'),
                dateStart    : startDate,
                dateEnd      : endDate,
                location     : $curEl.find('#personnelLocation').attr('data-location'),
                description  : {
                    en: $curEl.find('.objectivesTextarea[data-property="en"]').val(),
                    ar: $curEl.find('.objectivesTextarea[data-property="ar"]').val()
                },
                country      : this.locations.country,
                region       : this.locations.region,
                subRegion    : this.locations.subRegion,
                retailSegment: this.locations.retailSegment,
                outlet       : this.locations.outlet,
                branch       : this.locations.branch
            };

            if (this.linkedForm) {
                this.body.formType = this.linkedForm._id;
            }

            this.model.setFieldsNames(this.translation);

            this.model.validate(this.body, function (err) {
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
            var currentLanguage = App.currentUser.currentLanguage;

            e.preventDefault();
            data.append('data', JSON.stringify(context.body));

            async.waterfall([
                function (cb) {
                    $.ajax({
                        url        : context.model.urlRoot(),
                        type       : 'POST',
                        data       : data,
                        contentType: false,
                        processData: false,
                        success    : function (xhr) {
                            var model = new Model(xhr, {parse: true});

                            cb(null, model);

                        },
                        error      : function () {
                            cb(true);
                        }
                    });
                },

                function (model, cb) {
                    var visibilityFormAjax = context.visibilityFormAjax;
                    var VFData = null;
                    var file = null;

                    if (visibilityFormAjax) {
                        VFData = context.visibilityFormAjax.data;
                    }

                    if (VFData) {
                        file = context.visibilityFormAjax.data.get('inputBefore');
                    }

                    if (file) {
                        $.ajax({
                            url : '/file',
                            method : 'POST',
                            data : VFData,
                            contentType: false,
                            processData: false,
                            success : function (response) {
                                cb(null, model, response);
                            },
                            error : function () {
                                cb(true);
                            }
                        });
                    } else {
                        cb(null, model, {
                            files : []
                        });
                    }
                },

                function (model, files, cb) {
                    var formId;

                    if (!context.visibilityFormAjax) {
                        return cb(null, model);
                    }

                    context.visibilityFormAjax.success = function () {
                        cb(null, model);
                    };

                    context.visibilityFormAjax.error = function () {
                        cb(true);
                    };

                    formId = model.get('form')._id;
                    context.visibilityFormAjax.url = 'form/visibility/before/' + formId;

                    delete context.visibilityFormAjax.model;

                    context.visibilityFormAjax.contentType = 'application/json';
                    context.visibilityFormAjax.dataType = 'json';

                    context.visibilityFormAjax.data = JSON.stringify({
                        before : {
                            files : files.files.map(function (item) {
                                return item._id;
                            })
                        }
                    });

                    $.ajax(context.visibilityFormAjax);
                }

            ], function (err, model) {
                if (err) {
                    return App.render({type: 'error', message: ERROR_MESSAGES.inStoreNotSaved[currentLanguage]});
                }

                context.trigger('modelSaved', model);
            });
        },

        showAttachDialog: function () {
            this.fileDialogView = new FileDialogView({
                files      : this.files,
                contentType: this.contentType,
                translation: this.translation,
                dialogTitle: this.translation.dialogTitle,
                buttonName : this.translation.attach
            });
            this.fileDialogView.on('clickAttachFileButton', this.attachFile, this);
            this.fileDialogView.on('removeFile', this.removeFile, this);
        },

        linkVisibilityForm: function () {
            var self = this;

            this.linkedForm = CONSTANTS.OBJECTIVES_FORMS[1];

            this.$el.find('#formThumbnail').append(this.formTemplate({
                name       : self.linkedForm.name[this.currentLanguage],
                id         : self.linkedForm._id,
                translation: this.translation
            }));

            this.$el.find('.formBlock').show();
            this.hideLinkForm();
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
            var reader = new FileReader();
            var currentLanguage = App.currentUser.currentLanguage;

            reader.readAsDataURL(e.target.files[0]);
            reader.onload = function (elem) {
                var result = elem.target.result;
                var selectedFile;
                var type;
                var model;
                if (!result) {
                    self.files.remove(fileModel);
                    return;
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

                self.$el.find('.filesBlock').show();
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

        locationSelected: function (data) {
            var self = this;

            this.locations.country = data.country;
            this.locations.region = data.region;
            this.locations.subRegion = data.subRegion;
            this.locations.retailSegment = data.retailSegment;
            this.locations.outlet = data.outlet;
            this.locations.branch = data.branch;

            this.branchesForVisibility = _.filter(this.branchesForVisibility, function (branch) {
                return self.locations.branch.indexOf(branch._id) !== -1;
            });
            this.branchesForVisibility = _.uniq(this.branchesForVisibility, false, function (item) {
                return item._id;
            });
            this.branchesForVisibility = _.map(this.branchesForVisibility, function (branch) {
                return branch.name.currentLanguage;
            });

            this.$el.find('#personnelLocation').html(data.location);
            this.$el.find('#personnelLocation').attr('data-location', data.location);
        },

        showPersonnelView: function () {
            var personnelLocation = this.$el.find('#personnelLocation');
            var self = this;

            this.personnelListForSelectionView = new PersonnelListForSelectionView({
                multiselect       : false,
                withoutTabs       : true,
                parrentContentType: this.contentType,
                notCheckFilters   : true
            });
            this.personnelListForSelectionView.on('coverSaved', function (personnelCollection) {
                var jsonPersonnels = personnelCollection.toJSON();
                var personnelsIds = _.pluck(jsonPersonnels, '_id');
                var personnelsNames = _.pluck(jsonPersonnels, 'fullName').join(', ');
                var collectionJSON = personnelCollection.toJSON();
                var isTradeMarketer = collectionJSON.length === 1 && (collectionJSON[0].accessRole.level === 10 || collectionJSON[0].accessRole.level === 1);

                self.branchesForVisibility = [];

                if (!isTradeMarketer){
                    self.treeView = new TreeView({
                        ids             : personnelsIds,
                        instoreObjective: true,
                        selectedLevel   : jsonPersonnels[0].accessRole.level,
                        translation     : self.translation
                    });
                    self.treeView.on('locationSelected', self.locationSelected, self);
                } else {
                    self.$el.find('#personnelLocation').attr('data-location', 'empty');
                }

                self.$el.find('#assignDd').html(personnelsNames);
                self.assignedTo = jsonPersonnels;

                jsonPersonnels.forEach(function (personnel) {
                    self.branchesForVisibility = self.branchesForVisibility.concat(personnel.branch);
                });

                if (jsonPersonnels.length && !self.linkedForm) {
                    self.showLinkForm();
                } else {
                    self.hideLinkForm();
                }
            });
        },

        render: function () {
            var anotherLanguage = App.currentUser.currentLanguage === 'en' ? 'Ar' : 'En';
            var descriptionIdToHide = 'description' + anotherLanguage + 'Container';
            var titleIdToHide = 'title' + anotherLanguage;
            var jsonModel = this.model.toJSON();
            var formString = this.template({
                jsonModel  : jsonModel,
                translation: this.translation
            });
            var self = this;
            var dateStart = new Date();
            var dateEnd;
            var $startDate;
            var $endDate;
            var $curEl;

            this.$el = $(formString).dialog({
                dialogClass: 'create-dialog full-height-dialog',
                title      : this.translation.createTask,
                width      : '1000',
                buttons    : {
                    save: {
                        text : this.translation.saveBtn,
                        class: 'btn saveBtn',
                        click: function () {
                            var that = this;

                            self.saveObjective({save: true}, function () {
                                $(that).dialog('destroy').remove();
                            });
                        }
                    },

                    cancel: {
                        text: this.translation.cancelBtn
                    },

                    send: {
                        text : this.translation.sendBtn,
                        class: 'btn sendBtn',
                        click: function () {
                            var that = this;

                            self.saveObjective({save: false}, function () {
                                $(that).dialog('destroy').remove();
                            });
                        }
                    }
                }
            });

            $curEl = this.$el;

            $curEl.find('#' + descriptionIdToHide).hide();
            $curEl.find('#' + titleIdToHide).hide();
            $curEl.find('#filesBlock').hide();
            $curEl.find('#mainForm').on('submit', {body: this.body, context: this}, this.formSubmit);

            $startDate = $curEl.find('#dateStart');
            $endDate = $curEl.find('#dateEnd');

            $startDate.datepicker({
                changeMonth: true,
                changeYear : true,
                yearRange  : '-20y:c+10y',
                minDate    : new Date(dateStart),
                maxDate    : new Date(dateEnd),
                defaultDate: new Date(dateStart),
                onClose    : function (selectedDate) {
                    $endDate.datepicker('option', 'minDate', selectedDate);
                }
            });

            $endDate.datepicker({
                changeMonth: true,
                changeYear : true,
                yearRange  : '-20y:c+10y',
                minDate    : new Date(dateStart),
                maxDate    : new Date(dateEnd),
                defaultDate: new Date(dateEnd),
                onClose    : function (selectedDate) {
                    $startDate.datepicker('option', 'maxDate', selectedDate);
                }
            });

            implementShowHideArabicInputIn(this);

            this.objectivePriority = new FilterCollection(CONSTANTS.OBJECTIVES_PRIORITY, {parse: true});
            this.objectivePriority = this.objectivePriority.toJSON();

            populate.inputDropDown({
                selector    : '#priorityDd',
                context     : this,
                contentType : 'priority',
                displayModel: this.objectivePriority[1],
                collection  : this.objectivePriority
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
