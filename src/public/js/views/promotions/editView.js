var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var moment = require('moment');
var EditTemplate = require('../../../templates/promotions/edit.html');
var FileTemplate = require('../../../templates/file/preView.html');
var BaseView = require('../../views/baseDialog');
var FileDialogView = require('../../views/objectives/fileDialogView');
var Model = require('../../models/promotions');
var populate = require('../../populate');
var FileCollection = require('../../collections/file/collection');
var FileModel = require('../../models/file');
var CategoryCollection = require('../../collections/category/collection');
var DisplayTypeCollection = require('../../collections/displayType/collection');
var CountryModel = require('../../models/country');
var RegionModel = require('../../models/region');
var SubRegionModel = require('../../models/subRegion');
var RetailSegmentModel = require('../../models/retailSegment');
var OutletModel = require('../../models/outlet');
var BranchModel = require('../../models/branch');
var implementShowHideArabicInputIn = require('../../helpers/implementShowHideArabicInputIn');
var DropDownView = require('../../views/filter/dropDownView');
var CONSTANTS = require('../../constants/otherConstants');
var dataService = require('../../dataService');
var validation = require('../../validation');
var FileDialogPreviewView = require('../../views/fileDialog/fileDialog');
var CONTENT_TYPES = require('../../constants/contentType');
var ERROR_MESSAGES = require('../../constants/errorMessages');
var App = require('../../appState');

module.exports = BaseView.extend({
    el                   : '#contentHolder',
    contentType          : CONTENT_TYPES.PROMOTIONS,
    template             : _.template(EditTemplate),
    fileTemplate         : _.template(FileTemplate),
    imageSrc             : '',
    updateCount          : 0,
    ALLOWED_CONTENT_TYPES: _.union(
        CONSTANTS.IMAGE_CONTENT_TYPES,
        CONSTANTS.VIDEO_CONTENT_TYPES,
        CONSTANTS.MS_WORD_CONTENT_TYPES,
        CONSTANTS.MS_EXCEL_CONTENT_TYPES,
        CONSTANTS.MS_POWERPOINT_CONTENT_TYPES,
        CONSTANTS.OTHER_FORMATS
    ),

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

    showFilePreviewDialog: _.debounce(function (e) {
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
    }, 1000, true),

    checkValue: function (key, options, model) {
        var self = this;
        var $curEl = this.$el;
        var el = options.notDd ? $curEl.find('#' + key) : $curEl.find('#' + key + 'Dd');
        var value = options.attr ? el.attr('data-id') : el.val();

        var condition;

        if (['branch', 'outlet', 'retailSegment', 'region', 'subRegion', 'displayType'].indexOf(key) !== -1) {
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
            if (!model[key]) {
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
        allKeys.push('promotionType');
        allKeys = _.difference(allKeys, Object.keys(this.body));
        dateKeys = _.intersection(dateKeys, allKeys);
        keysToSimpleCopy.push('promotionType');
        keysToSimpleCopy = _.intersection(keysToSimpleCopy, allKeys);
        keysToPluck = _.intersection(['outlet', 'branch', 'retailSegment', 'region', 'subRegion'], allKeys);
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

    savePromotion: function (options, cb) {
        var model = this.model.toJSON();
        var self = this;
        var $curEl = this.$el;
        var promotionType = {
            en: $curEl.find('.objectivesTextarea[data-property="en"]').val(),
            ar: $curEl.find('.objectivesTextarea[data-property="ar"]').val()
        };
        var arrForVal = ['barcode', 'packing', 'ppt', 'quantity', 'dateStart', 'dateEnd'];
        var arrForDate = ['dateStart', 'dateEnd'];
        var keys = _.union(['country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'category', 'displayType'], arrForVal);
        var modelStatus = this.model.get('status');
        var statusBoolean = modelStatus._id === 'draft';
        var selectedFiles;
        var attachments;
        var files;
        var change;
        this.body = {};
        this.checkForEmptyInput(this.files, this.$el);

        keys.forEach(function (key) {
            var attr = _.indexOf(arrForVal, key) === -1;
            var date = _.indexOf(arrForDate, key) !== -1;
            var notDd = _.indexOf(arrForVal, key) !== -1;
            var optionsToCheck = {
                attr : attr,
                date : date,
                notDd: notDd
            };
            self.checkValue(key, optionsToCheck, model);
        });
        if (promotionType.ar !== model.promotionType.ar || promotionType.en !== model.promotionType.en) {
            this.body.promotionType = promotionType;
        }
        if (this.duplicate) {
            self.checkIfDuplicate(arrForDate, arrForVal, keys, model);
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

        this.body.savePromotion = modelStatus._id === 'active' && options.save ? false : options.save;

        if (statusBoolean === this.body.savePromotion && Object.keys(this.body).length === 1) {
            delete this.body.savePromotion;
        }

        if (!Object.keys(this.body).length && !this.updateCount) {
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
                }
                if (self.duplicate) {
                    self.body.duplicate = true;
                }

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
                var model = new Model(model, {parse: true});

                context.trigger('modelSaved', model);
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
            buttonName : this.translation.attachBtn,
            translation: this.translation
        });
        this.fileDialogView.on('clickAttachFileButton', this.attachFile, this);
        this.fileDialogView.on('removeFile', this.removeFile, this);
    },

    removeFile: function (file) {
        var fileId = file.get('_id') || file.cid;
        var $thumbnail = this.$el.find('.fileThumbnailItem[data-id = "' + fileId + '"]');
        --this.updateCount;

        $thumbnail.remove();

        this.attachments = _.without(this.attachments, fileId);

        this.files.remove(file, {silent: true});
        this.$el.find('#' + file.cid).remove();

    },

    setSelectedFiles: function () {
        var self = this;

        this.files.forEach(function (fileModel) {
            fileModel = fileModel.toJSON();
            self.$el.find('#fileThumbnail').append(self.fileTemplate({
                model: fileModel
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
        var currentLanguage = (App.currentUser && App.currentUser.currentLanguage) ? App.currentUser.currentLanguage : 'en';

        reader.readAsDataURL(e.target.files[0]);

        reader.onload = function (el) {
            var result = el.target.result;
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
        var countryId = jsonModel.country._id;
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
        this.locationFilter.country = {type: 'ObjectId', values: [countryId]};
        this.locationFilter.region = {type: 'ObjectId', values: regionIds};
        this.locationFilter.subRegion = {type: 'ObjectId', values: subRegionIds};
        this.locationFilter.retailSegment = {type: 'ObjectId', values: retailSegmentIds};
        this.locationFilter.outlet = {type: 'ObjectId', values: outletIds};
        this.locationFilter.branch = {type: 'ObjectId', values: branchIds};

        dataService.postData('/filters/promotions/location', {
            query: JSON.stringify({
                edit  : true,
                filter: this.locationFilter
            })
        }, function (err, result) {
            if (err) {
                App.render(err);
            }

            self.countryCollection = new Backbone.Collection(result.country, {model: CountryModel, parse: true});
            self.regionCollection = new Backbone.Collection(result.region, {model: RegionModel, parse: true});
            self.subRegionCollection = new Backbone.Collection(result.subRegion, {
                model: SubRegionModel,
                parse: true
            });
            self.retailSegmentCollection = new Backbone.Collection(result.retailSegment, {
                model: RetailSegmentModel,
                parse: true
            });
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
                self.countryDropDown.setSelectedByIds({ids: [countryId]});
            }, self);

            self.regionDropDown = new DropDownView({
                dropDownList       : self.regionCollection,
                displayText        : self.translation.selectRegion,
                contentType        : 'region',
                multiSelect        : true,
                noSingleSelectEvent: true,
                noAutoSelectOne    : true,
                showSelectAll      : true
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
                noAutoSelectOne    : true,
                showSelectAll      : true
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
                noAutoSelectOne    : true,
                showSelectAll      : true
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
                noAutoSelectOne    : true,
                showSelectAll      : true
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
                noAutoSelectOne    : true,
                showSelectAll      : true
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

        if (index !== -1) {
            for (var i = index + 1; i <= array.length; i++) {
                delete this.locationFilter[array[i]];
            }
        }

        dataService.getData('/filters/promotions/location', {filter: this.locationFilter}, function (err, result) {
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
        var dateStart = moment(jsonModel.dateStart, 'DD.MM.YYYY');
        var dateEnd = moment(jsonModel.dateEnd, 'DD.MM.YYYY');
        var $startDate;
        var $dueDate;
        var startDateObj;
        var endDateObj;
        var defaultCategory;
        var $curEl;

        var buttons = {
            save: {
                text : self.translation.saveBtn,
                class: 'btn saveBtn',
                click: function () {
                    var that = this;
                    var saveBool = (jsonModel.status._id === 'draft');

                    self.savePromotion({save: saveBool}, function () {
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

                    self.savePromotion({save: false}, function () {
                        $(that).dialog('destroy').remove();
                    });
                }
            };
        }

        jsonModel.duplicate = this.duplicate;
        formString = this.template({
            jsonModel  : jsonModel,
            translation: this.translation,
            App: App,
        });

        this.$el = $(formString).dialog({
            dialogClass: 'create-dialog full-height-dialog',
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
            defaultDate: new Date(dateStart),
            onClose    : function (selectedDate) {
                $dueDate.datepicker('option', 'minDate', selectedDate);
            }
        };

        endDateObj = {
            changeMonth: true,
            changeYear : true,
            yearRange  : '-20y:c+10y',
            defaultDate: new Date(dateEnd),
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
        this.categoryCollection.on('reset', function () {
            defaultCategory = this.categoryCollection.findWhere({_id: jsonModel.category._id});
            populate.inputDropDown({
                selector    : '#categoryDd',
                context     : this,
                contentType : 'category',
                displayModel: defaultCategory.toJSON(),
                collection  : this.categoryCollection.toJSON()
            });
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
                contentType : 'displayType',
                displayText : 'display type',
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
