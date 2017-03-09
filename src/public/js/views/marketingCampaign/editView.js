'use strict';
define([
    'backbone',
    'Underscore',
    'jQuery',
    'text!templates/marketingCampaign/edit.html',
    'text!templates/file/preView.html',
    'views/baseDialog',
    'views/objectives/fileDialogView',
    'views/personnel/listForSelection',
    'models/marketingCampaign',
    'populate',
    'collections/file/collection',
    'models/file',
    'collections/category/collection',
    'models/country',
    'models/region',
    'models/subRegion',
    'models/retailSegment',
    'models/outlet',
    'models/branch',
    'models/category',
    'helpers/implementShowHideArabicInputIn',
    'views/filter/dropDownView',
    'constants/otherConstants',
    'constants/contentType',
    'moment',
    'dataService',
    'validation',
    'views/fileDialog/fileDialog',
    'collections/displayType/collection',
    'constants/errorMessages'
], function (Backbone, _, $, EditTemplate, FileTemplate, BaseView, FileDialogView, PersonnelListForSelectionView,
             Model, populate, FileCollection, FileModel, CategoryCollection, CountryModel, RegionModel,
             SubRegionModel, RetailSegmentModel, OutletModel, BranchModel, CategoryModel, implementShowHideArabicInputIn,
             DropDownView, CONSTANTS, CONTENT_TYPES, moment, dataService, validation, FileDialogPreviewView,
             DisplayTypeCollection, ERROR_MESSAGES) {

    var CreateView = BaseView.extend({
        contentType          : CONTENT_TYPES.MARKETING_CAMPAIGN,
        template             : _.template(EditTemplate),
        fileTemplate         : _.template(FileTemplate),
        imageSrc             : '',
        updateCount          : 0,
        ALLOWED_CONTENT_TYPES: _.union(CONSTANTS.IMAGE_CONTENT_TYPES, CONSTANTS.MS_WORD_CONTENT_TYPES, CONSTANTS.MS_EXCEL_CONTENT_TYPES, CONSTANTS.OTHER_FORMATS),

        events: {
            'click #assignDd'        : 'showPersonnelView',
            'click #attachFile'      : 'showAttachDialog',
            'click .masonryThumbnail': 'showFilePreviewDialog',
            'click #downloadFile'    : 'stopPropagation'
        },

        initialize: function (options) {
            options = options || {};
            this.translation = options.translation;
            this.duplicate = options.duplicate;
            this.attachments = _.pluck(this.model.get('attachments'), '_id');
            this.files = new FileCollection(this.model.get('attachments'));
            this.locationFilter = {};
            if (!this.duplicate) {
                this.setChecked();
            }
            this.makeRender();
            this.render();
            if (!this.duplicate) {
                this.setSelectedFiles();
            }
            _.bindAll(this, 'fileSelected');
        },

        setChecked: function () {
            var self = this;
            var modelJSON = this.model.toJSON();
            var attachments = modelJSON.attachments;
            attachments.forEach(function (attach) {
                var file = _.findWhere(self.files.models, {id: attach._id});
                if (file) {
                    file.set('selected', true);
                }
            });
        },

        showFilePreviewDialog: function (e) {
            var $el = $(e.target);
            var $thumbnail = $el.closest('.masonryThumbnail');
            var fileModelId = $thumbnail.attr('data-id');
            var fileModel = this.files.get(fileModelId);

            this.fileDialogView = new FileDialogPreviewView({
                fileModel  : fileModel,
                bucket     : this.contentType,
                translation: this.translation
            });
            this.fileDialogView.on('download', function (options) {
                var url = options.url;
                var originalName = options.originalName;
                var $fileElement;
                $thumbnail.append('<a class="hidden" id="downloadFile" href="' + url + '" download="' + originalName + '"></a>');
                $fileElement = $thumbnail.find('#downloadFile');
                $fileElement[0].click();
                $fileElement.remove();
            });
        },

        checkValue: function (key, options, model) {
            var self = this;
            var $curEl = this.$el;
            var el = options.notDd ? $curEl.find('#' + key) : $curEl.find('#' + key + 'Dd');
            var value = options.attr ? el.attr('data-id') : el.val();

            var condition;
            if (['region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'category', 'country', 'displayType'].indexOf(key) !== -1) {
                condition = true;

                if (!model[key] || !value || self.duplicate) {
                    condition = false;
                } else {
                    model[key].forEach(function (newKey) {
                        if (_.indexOf(value.split(','), newKey._id.toString()) === -1) {
                            condition = false;
                        }
                    });

                    if (model[key].length !== value.split(',').length) {
                        condition = false;
                    }
                }
            } else {
                if (!model[key] || !value) {
                    condition = false;
                } else {
                    condition = options.attr ? value === model[key]._id.toString() : value === model[key].toString();
                }
            }

            if (options.date && !condition) {
                value = moment(value, 'DD.MM.YYYY, h:mm:ss');
                value = key === 'dateStart' ? value.set('hour', 0).set('minute', 1) : value.set('hour', 23).set('minute', 59);
                this.body[key] = value;
                return;
            }
            if (!condition) {
                this.body[key] = value;
            }
        },

        checkIfDuplicate: function (dateKeys, keysToSimpleCopy, allKeys, model) {
            var body = this.body;
            var keysToPluck;
            var keysToGetId;
            var value;
            allKeys.push('description');
            allKeys = _.difference(allKeys, Object.keys(this.body));
            dateKeys = _.intersection(dateKeys, allKeys);
            keysToSimpleCopy.push('description');
            keysToSimpleCopy = _.intersection(keysToSimpleCopy, allKeys);
            keysToPluck = _.intersection(['branch', 'category', 'country'], allKeys);
            keysToSimpleCopy = _.difference(keysToSimpleCopy, dateKeys);
            keysToGetId = _.difference(allKeys, _.union(dateKeys, keysToSimpleCopy, keysToPluck));

            if (dateKeys.length) {
                dateKeys.forEach(function (key) {
                    value = moment(model[key], 'DD.MM.YYYY, h:mm:ss');
                    value = key === 'dateStart' ? value.set('hour', 0).set('minute', 1) : value.set('hour', 23).set('minute', 59);
                    body[key] = value;
                });
            }
            if (keysToSimpleCopy.length) {
                keysToSimpleCopy.forEach(function (key) {
                    body[key] = model[key];
                });
            }
            if (keysToPluck.length) {
                keysToPluck.forEach(function (key) {
                    body[key] = _.pluck(model[key], '_id');
                });
            }
            if (keysToGetId.length) {
                keysToGetId.forEach(function (key) {
                    body[key] = model[key]._id;
                });
            }
        },

        saveBrandingAndDisplay: function (options, cb) {
            var model = this.model.toJSON();
            var booleanStatus = model.status._id === 'draft';
            var self = this;
            var $curEl = this.$el;
            var selectedFiles;
            var description;
            var attachments;
            var arrForDate;
            var keys;
            var files;
            var change;
            this.body = {};
            this.checkForEmptyInput(this.files, this.$el);

            description = {
                en: $curEl.find('.objectivesTextarea[data-property="en"]').val(),
                ar: $curEl.find('.objectivesTextarea[data-property="ar"]').val()
            };
            arrForDate = ['dateStart', 'dateEnd'];
            keys = _.union(['country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'category', 'displayType'], arrForDate);

            keys.forEach(function (key) {
                var attr = _.indexOf(arrForDate, key) === -1;
                var date = _.indexOf(arrForDate, key) !== -1;
                var notDd = _.indexOf(arrForDate, key) !== -1;
                var optionsToCheckValue = {
                    attr : attr,
                    date : date,
                    notDd: notDd
                };
                self.checkValue(key, optionsToCheckValue, model);
            });

            if (description.ar !== model.description.ar || description.en !== model.description.en) {
                this.body.description = description;
            }

            if (this.duplicate) {
                self.checkIfDuplicate(arrForDate, [], keys, model);
            }

            if (this.linkedForm) {
                this.body.formType = this.linkedForm._id;
            }

            files = this.files.toJSON();
            attachments = _.pluck(model.attachments, '_id');
            selectedFiles = _.where(files, {selected: true});
            selectedFiles = _.pluck(selectedFiles, '_id');

            if (selectedFiles.length) {
                change = _.difference(selectedFiles, attachments);
                if (change.length || selectedFiles.length !== attachments.length) {
                    this.body.attachments = selectedFiles;
                }
            } else {
                this.body.attachments = null;
            }

            if (!Object.keys(this.body).length && !this.updateCount && booleanStatus === options.save) {
                return cb();
            }

            this.model.setFieldsNames(this.translation, this.body);

            this.model.validate(this.body, function (err) {
                if (err && err.length) {
                    App.renderErrors(err);
                } else {
                    if (self.body.attachments) {
                        self.body.attachments = _.compact(self.body.attachments);
                        self.body.attachments = self.body.attachments.length ? self.body.attachments : [];
                    } else {
                        self.body.attachments = null;
                    }

                    self.body.save = options.save;
                    self.$el.find('#mainForm').submit();
                    cb();
                }
            });
        },

        formSubmit: function (e) {
            var context = e.data.context;
            var data = new FormData(this);
            var ajaxData = {
                data       : data,
                contentType: false,
                processData: false,
                success    : function (model) {
                    var newModel = new Model(model, {parse: true});
                    context.trigger('modelSaved', newModel);
                }
            };

            e.preventDefault();

            if (!context.duplicate) {
                ajaxData.url = context.model.url();
                ajaxData.type = 'PUT';
            } else {
                ajaxData.url = context.model.urlRoot();
                ajaxData.type = 'POST';
            }

            data.append('data', JSON.stringify(context.body));

            $.ajax(ajaxData);
        },

        showAttachDialog: function () {
            this.fileDialogView = new FileDialogView({
                files      : this.files,
                contentType: this.contentType,
                dialogTitle: this.translation.dialogTitle,
                buttonName : this.translation.attachButtonName,
                translation: this.translation
            });
            this.fileDialogView.on('clickAttachFileButton', this.attachFile, this);
            this.fileDialogView.on('removeFile', this.removeFile, this);
        },

        removeFile: function (file) {
            var fileId = file.get('_id') || file.cid;
            var $thumbnail = this.$el.find('.fileThumbnailItem[data-id = "' + fileId + '"]');

            $thumbnail.remove();
            --this.updateCount;

            this.attachments = _.without(this.attachments, fileId);

            if (!file.get('selected')) {
                this.files.remove(file, {silent: true});
                this.$el.find('#' + file.cid).remove();
            }
        },

        setSelectedFiles: function () {
            var self = this;

            this.files.models.forEach(function (fileModel) {
                var fileModelJSON = fileModel.toJSON();
                self.$el.find('#fileThumbnail').append(self.fileTemplate({
                    model: fileModelJSON
                }));
            });

            this.$el.find('#filesBlock').show();
            App.masonryGrid.call(self.$el);
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
                    App.renderErrors([ERROR_MESSAGES.forbiddenTypeOfFile[currentLanguage]]);
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

                ++self.updateCount;
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

        renderLocations: function () {
            var self = this;
            var jsonModel = this.model.toJSON();
            var countryIds = _.pluck(jsonModel.country, '_id');
            var regionIds = _.pluck(jsonModel.region, '_id');
            var subRegionIds = _.pluck(jsonModel.subRegion, '_id');
            var retailSegmentIds = _.pluck(jsonModel.retailSegment, '_id');
            var outletIds = _.pluck(jsonModel.outlet, '_id');
            var branchIds = _.pluck(jsonModel.branch, '_id');
            var comparator = function (model) {
                return model.get('name').currentLanguage;
            };
            var $curEl = this.$el;

            this.locationFilter = {};
            this.locationFilter.country = {type: 'ObjectId', values: countryIds};
            this.locationFilter.region = {type: 'ObjectId', values: regionIds};
            this.locationFilter.subRegion = {type: 'ObjectId', values: subRegionIds};
            this.locationFilter.retailSegment = {type: 'ObjectId', values: retailSegmentIds};
            this.locationFilter.outlet = {type: 'ObjectId', values: outletIds};
            this.locationFilter.branch = {type: 'ObjectId', values: branchIds};

            dataService.getData('/filters/brandingActivityCreate', {
                edit  : true,
                filter: this.locationFilter
            }, function (err, result) {
                if (err) {
                    App.render(err);
                }

                self.countryCollection = new Backbone.Collection(result.country, {model: CountryModel, parse: true});
                self.regionCollection = new Backbone.Collection(result.region, {model: RegionModel, parse: true});
                self.subRegionCollection = new Backbone.Collection(result.subRegion, {model: SubRegionModel, parse: true});
                self.retailSegmentCollection = new Backbone.Collection(result.retailSegment, {model: RetailSegmentModel, parse: true});
                self.outletCollection = new Backbone.Collection(result.outlet, {model: OutletModel, parse: true});
                self.branchCollection = new Backbone.Collection(result.branch, {model: BranchModel, parse: true});

                self.countryCollection.comparator = comparator;
                self.regionCollection.comparator = comparator;
                self.subRegionCollection.comparator = comparator;
                self.retailSegmentCollection.comparator = comparator;
                self.outletCollection.comparator = comparator;
                self.branchCollection.comparator = comparator;


                self.countryDropDown = new DropDownView({
                    dropDownList       : self.countryCollection,
                    displayText        : self.translation.selectCountry,
                    contentType        : 'country',
                    singleUnselect     : true,
                    noSingleSelectEvent: true,
                    noAutoSelectOne    : true
                });
                $curEl.find('#countryDd').replaceWith(self.countryDropDown.el);
                self.countryCollection.once('reset', function () {
                    self.countryDropDown.setSelectedByIds({ids: countryIds});
                }, self);

                self.regionDropDown = new DropDownView({
                    dropDownList       : self.regionCollection,
                    displayText        : self.translation.selectRegion,
                    contentType        : 'region',
                    multiSelect        : true,
                    noSingleSelectEvent: true,
                    noAutoSelectOne    : true
                });
                $curEl.find('#regionDd').replaceWith(self.regionDropDown.el);
                if (!self.duplicate) {
                    self.regionCollection.once('reset', function () {
                        self.regionDropDown.setSelectedByIds({ids: regionIds});
                    }, self);
                }

                self.subRegionDropDown = new DropDownView({
                    dropDownList       : self.subRegionCollection,
                    displayText        : self.translation.selectSubRegion,
                    contentType        : 'subRegion',
                    multiSelect        : true,
                    noSingleSelectEvent: true,
                    noAutoSelectOne    : true
                });
                $curEl.find('#subRegionDd').replaceWith(self.subRegionDropDown.el);
                if (!self.duplicate) {
                    self.subRegionCollection.once('reset', function () {
                        self.subRegionDropDown.setSelectedByIds({ids: subRegionIds});
                    }, self);
                }

                self.retailSegmentDropDown = new DropDownView({
                    dropDownList       : self.retailSegmentCollection,
                    displayText        : self.translation.selectRetailSegment,
                    contentType        : 'retailSegment',
                    multiSelect        : true,
                    noSingleSelectEvent: true,
                    noAutoSelectOne    : true
                });
                $curEl.find('#retailSegmentDd').replaceWith(self.retailSegmentDropDown.el);
                if (!self.duplicate) {
                    self.retailSegmentCollection.once('reset', function () {
                        self.retailSegmentDropDown.setSelectedByIds({ids: retailSegmentIds});
                    }, self);
                }

                self.outletDropDown = new DropDownView({
                    dropDownList       : self.outletCollection,
                    displayText        : self.translation.selectOutlet,
                    contentType        : 'outlet',
                    multiSelect        : true,
                    noSingleSelectEvent: true,
                    noAutoSelectOne    : true
                });
                $curEl.find('#outletDd').replaceWith(self.outletDropDown.el);
                if (!self.duplicate) {
                    self.outletCollection.once('reset', function () {
                        self.outletDropDown.setSelectedByIds({ids: outletIds});
                    }, self);
                }

                self.branchDropDown = new DropDownView({
                    dropDownList       : self.branchCollection,
                    displayText        : self.translation.selectBranch,
                    contentType        : 'branch',
                    multiSelect        : true,
                    noSingleSelectEvent: true,
                    noAutoSelectOne    : true
                });
                $curEl.find('#branchDd').replaceWith(self.branchDropDown.el);
                if (!self.duplicate) {
                    self.branchCollection.once('reset', function () {
                        self.branchDropDown.setSelectedByIds({ids: branchIds});
                    }, self);
                }

                self.countryDropDown.collection.reset(result.country, {parse: true});
                self.regionDropDown.collection.reset(result.region, {parse: true});
                self.subRegionDropDown.collection.reset(result.subRegion, {parse: true});
                self.retailSegmentDropDown.collection.reset(result.retailSegment, {parse: true});
                self.outletDropDown.collection.reset(result.outlet, {parse: true});
                self.branchDropDown.collection.reset(result.branch, {parse: true});

                self.countryDropDown.on('changeItem', function (opts) {
                    var id = opts.model._id;

                    if (id) {
                        self.locationFilter.country = {type: 'ObjectId', values: [id]};
                        self.resetLocations({notCountry: true, currentCT: 'country'});

                    } else {
                        delete self.locationFilter.country;
                        self.resetLocations({notCountry: false, currentCT: 'country'});
                    }

                }, self);

                self.regionDropDown.on('changeItem', function (opts) {
                    var ids = opts.selectedValuesIds;

                    if (ids.length) {
                        self.locationFilter.region = {type: 'ObjectId', values: ids};
                        self.resetLocations({notRegion: true, currentCT: 'region'});
                    } else {
                        delete self.locationFilter.region;
                        self.resetLocations({notRegion: false, currentCT: 'region'});
                    }

                }, self);

                self.subRegionDropDown.on('changeItem', function (opts) {
                    var ids = opts.selectedValuesIds;

                    if (ids.length) {
                        self.locationFilter.subRegion = {type: 'ObjectId', values: ids};
                        self.resetLocations({notSubRegion: true, currentCT: 'subRegion'});
                    } else {
                        delete self.locationFilter.subRegion;
                        self.resetLocations({notSubRegion: false, currentCT: 'subRegion'});
                    }
                }, self);

                self.retailSegmentDropDown.on('changeItem', function (opts) {
                    var ids = opts.selectedValuesIds

                    if (ids.length) {
                        self.locationFilter.retailSegment = {type: 'ObjectId', values: ids};
                        self.resetLocations({notRetailSegment: true, currentCT: 'retailSegment'});
                    } else {
                        delete self.locationFilter.retailSegment;
                        self.resetLocations({notRetailSegment: false, currentCT: 'retailSegment'});
                    }
                }, self);

                self.outletDropDown.on('changeItem', function (opts) {
                    var ids = opts.selectedValuesIds;

                    if (ids.length) {
                        self.locationFilter.outlet = {type: 'ObjectId', values: ids};
                        self.resetLocations({notOutlet: true, currentCT: 'outlet'});
                    } else {
                        delete self.locationFilter.outlet;
                        self.resetLocations({notOutlet: false, currentCT: 'outlet'});
                    }
                }, self);

                self.branchDropDown.on('changeItem', function (opts) {
                    var ids = opts.selectedValuesIds;

                    if (ids.length) {
                        self.locationFilter.branch = {type: 'ObjectId', values: ids};
                        self.resetLocations({notBranch: true, currentCT: 'branch'});
                    } else {
                        delete self.locationFilter.branch;
                        self.resetLocations({notBranch: false, currentCT: 'branch'});
                    }
                }, self);

            });
        },

        resetLocations: function (options) {
            var self = this;
            var array = ['country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch'];
            var key = options.currentCT || '';
            var index = array.indexOf(key);
            var i = index + 1;
            if (index !== -1) {
                for (i; i <= array.length; i++) {
                    delete this.locationFilter[array[i]];
                }
            }

            dataService.getData('/filters/brandingActivityCreate', {filter: self.locationFilter}, function (err, result) {
                if (err) {
                    return App.render(err);
                }

                if (!options.notCountry) {
                    self.countryDropDown.collection.reset(result.country, {parse: true});
                }
                if (!options.notRegion) {
                    self.regionDropDown.collection.reset(result.region, {parse: true});
                }
                if (!options.notSubRegion) {
                    self.subRegionDropDown.collection.reset(result.subRegion, {parse: true});
                }
                if (!options.notRetailSegment) {
                    self.retailSegmentDropDown.collection.reset(result.retailSegment, {parse: true});
                }
                if (!options.notOutlet) {
                    self.outletDropDown.collection.reset(result.outlet, {parse: true});
                }
                if (!options.notBranch) {
                    self.branchDropDown.collection.reset(result.branch, {parse: true});
                }
            });
        },

        render: function () {
            var anotherLanguage = App.currentUser.currentLanguage === 'en' ? 'Ar' : 'En';
            var idToHide = 'description' + anotherLanguage + 'Container';
            var jsonModel = this.model.toJSON();
            var formString;
            var self = this;
            var dateStart = new Date();
            var dateEnd;
            var $startDate;
            var $dueDate;
            var startDateObj;
            var endDateObj;
            var $curEl;

            var buttons = {
                save: {
                    text : this.translation.saveBtn,
                    class: 'btn saveBtn',
                    click: function () {
                        var that = this;
                        var saveBool = (jsonModel.status._id === 'draft');

                        self.saveBrandingAndDisplay({save: saveBool}, function () {
                            $(that).dialog('destroy').remove();
                        });
                    }
                }
            };

            if (this.duplicate || jsonModel.status._id === 'draft') {
                buttons.send = {
                    text : self.translation.publishBtn,
                    class: 'btn sendBtn',
                    click: function () {
                        var that = this;

                        self.saveBrandingAndDisplay({save: false}, function () {
                            $(that).dialog('destroy').remove();
                        });
                    }
                };
            }

            jsonModel.duplicate = this.duplicate;
            formString = this.template({
                jsonModel  : jsonModel,
                translation: this.translation
            });

            this.$el = $(formString).dialog({
                dialogClass: 'create-dialog full-height-dialog',
                title      : this.duplicate ? this.translation.duplicateBranding : this.translation.editBranding,
                width      : '1000',
                buttons    : buttons
            });

            $curEl = this.$el;

            $curEl.find('#' + idToHide).hide();
            $curEl.find('#filesBlock').hide();
            $curEl.find('#mainForm').on('submit', {body: this.body, context: this}, this.formSubmit);

            $startDate = $curEl.find('#dateStart');
            $dueDate = $curEl.find('#dateEnd');

            startDateObj = {
                changeMonth: true,
                changeYear : true,
                yearRange  : '-20y:c+10y',
                minDate    : new Date(dateStart),
                maxDate    : new Date(dateEnd),
                defaultDate: moment(jsonModel.dateStart, 'DD.MM.YYYY').toDate(),
                onClose    : function (selectedDate) {
                    $dueDate.datepicker('option', 'minDate', selectedDate);
                }
            };

            endDateObj = {
                changeMonth: true,
                changeYear : true,
                yearRange  : '-20y:c+10y',
                minDate    : new Date(dateStart),
                maxDate    : new Date(dateEnd),
                defaultDate: moment(jsonModel.dateEnd, 'DD.MM.YYYY').toDate(),
                onClose    : function (selectedDate) {
                    $startDate.datepicker('option', 'maxDate', selectedDate);
                }
            };

            if (!this.duplicate) {
                startDateObj.maxDate = new Date(dateEnd);
                endDateObj.minDate = new Date(dateStart);
            }

            $startDate.datepicker(startDateObj);
            $dueDate.datepicker(endDateObj);

            implementShowHideArabicInputIn(this);
            this.categoryCollection = new CategoryCollection();
            this.categoryDropDown = new DropDownView({
                dropDownList       : this.categoryCollection,
                displayText        : this.translation.selectCategory,
                contentType        : CONTENT_TYPES.CATEGORY,
                multiSelect        : true,
                noSingleSelectEvent: true,
                noAutoSelectOne    : true
            });
            $curEl.find('#categoryDd').replaceWith(this.categoryDropDown.el);
            this.categoryCollection.once('reset', function () {
                this.categoryDropDown.setSelectedByIds({ids: _.pluck(jsonModel.category, '_id')});
            }, this);


            this.renderLocations();

            this.displayTypeCollection = new DisplayTypeCollection();
            this.displayTypeCollection.on('reset', function () {
                const defaultDisplayTypes = jsonModel.displayType.map(function (item) {
                    return self.displayTypeCollection.findWhere({_id : item._id}).toJSON();
                });

                populate.inputDropDown({
                    selector    : '#displayTypeDd',
                    context     : this,
                    contentType : CONTENT_TYPES.DISPLAYTYPE,
                    displayText : this.translation.displayType,
                    displayModel: defaultDisplayTypes,
                    collection  : this.displayTypeCollection.toJSON(),
                    forPosition : true,
                    multiSelect : true,
                    showSelectAll : true
                });
            }, this);

            $curEl.find('.objectivesTextarea').each(function (index, element) {
                var $element = $(element);

                $element.ckeditor({language: $element.attr('data-property')});
            });

            this.delegateEvents(this.events);

            return this;
        }
    });

    return CreateView;
});
