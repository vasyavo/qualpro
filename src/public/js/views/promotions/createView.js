'use strict';
define([
    'backbone',
    'Underscore',
    'jQuery',
    'constants/contentType',
    'text!templates/promotions/create.html',
    'text!templates/file/preView.html',
    'views/baseDialog',
    'views/objectives/fileDialogView',
    'views/personnel/listForSelection',
    'models/promotions',
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
        contentType          : CONTENT_TYPES.PROMOTIONS,
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
            var promotionType = {
                en: $curEl.find('.objectivesTextarea[data-property="en"]').val(),
                ar: $curEl.find('.objectivesTextarea[data-property="ar"]').val()
            };

            var arrForVal = ['barcode', 'packing', 'ppt', 'quantity', 'dateStart', 'dateEnd'];
            var arrForDate = ['dateStart', 'dateEnd'];
            var keys = _.union(['country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'category', 'displayType'], arrForVal);
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

            this.body.promotionType = promotionType;

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
                dialogTitle: this.translation.dialogTitle,
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

        renderLocations: function () {
            var self = this;
            var comparator = function (model) {
                return model.get('name').currentLanguage;
            };

            dataService.getData('/filters/promotions/location', {filter: this.locationFilter}, function (err, result) {
                if (err) {
                    return console.dir(err);
                }

                self.countryCollection = new Backbone.Collection(result.country, {
                    model: CountryModel,
                    parse: true
                });
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
                self.$el.find('#countryDd').replaceWith(self.countryDropDown.el);

                self.regionDropDown = new DropDownView({
                    dropDownList       : self.regionCollection,
                    displayText        : self.translation.selectRegion,
                    contentType        : 'region',
                    multiSelect        : true,
                    noSingleSelectEvent: true,
                    noAutoSelectOne    : true,
                    showSelectAll      : true
                });
                self.$el.find('#regionDd').replaceWith(self.regionDropDown.el);

                self.subRegionDropDown = new DropDownView({
                    dropDownList       : self.subRegionCollection,
                    displayText        : self.translation.selectSubRegion,
                    contentType        : 'subRegion',
                    multiSelect        : true,
                    noSingleSelectEvent: true,
                    noAutoSelectOne    : true,
                    showSelectAll      : true
                });
                self.$el.find('#subRegionDd').replaceWith(self.subRegionDropDown.el);

                self.retailSegmentDropDown = new DropDownView({
                    dropDownList       : self.retailSegmentCollection,
                    displayText        : self.translation.selectRetailSegment,
                    contentType        : 'retailSegment',
                    multiSelect        : true,
                    noSingleSelectEvent: true,
                    noAutoSelectOne    : true,
                    showSelectAll      : true
                });
                self.$el.find('#retailSegmentDd').replaceWith(self.retailSegmentDropDown.el);

                self.outletDropDown = new DropDownView({
                    dropDownList       : self.outletCollection,
                    displayText        : self.translation.selectOutlet,
                    contentType        : 'outlet',
                    multiSelect        : true,
                    noSingleSelectEvent: true,
                    noAutoSelectOne    : true,
                    showSelectAll      : true
                });
                self.$el.find('#outletDd').replaceWith(self.outletDropDown.el);

                self.branchDropDown = new DropDownView({
                    dropDownList       : self.branchCollection,
                    displayText        : self.translation.selectBranch,
                    contentType        : 'branch',
                    multiSelect        : true,
                    noSingleSelectEvent: true,
                    noAutoSelectOne    : true,
                    showSelectAll      : true
                });
                self.$el.find('#branchDd').replaceWith(self.branchDropDown.el);

                self.countryDropDown.collection.reset(result.country, {parse: true});
                self.regionDropDown.collection.reset(result.region, {parse: true});
                self.subRegionDropDown.collection.reset(result.subRegion, {parse: true});
                self.retailSegmentDropDown.collection.reset(result.retailSegment, {parse: true});
                self.outletDropDown.collection.reset(result.outlet, {parse: true});
                self.branchDropDown.collection.reset(result.branch, {parse: true});

                self.countryDropDown.on('changeItem', function (opts) {
                    var id = opts.model._id;

                    if (id) {
                        self.locationFilter = {};
                        self.locationFilter.country = {type: 'ObjectId', values: [id]};
                    } else {
                        delete self.locationFilter.country;
                    }

                    self.resetLocations({notCountry: true});
                }, self);

                self.regionDropDown.on('changeItem', function (opts) {
                    var ids = opts.selectedValuesIds;

                    if (ids.length) {
                        self.locationFilter.region = {type: 'ObjectId', values: ids};

                        delete self.locationFilter.subRegion;
                        delete self.locationFilter.outlet;
                        delete self.locationFilter.retailSegment;
                        delete self.locationFilter.branch;
                    } else {
                        delete self.locationFilter.region;
                    }

                    self.resetLocations({
                        notRegion : true,
                        notCountry: true
                    });
                }, self);

                self.subRegionDropDown.on('changeItem', function (opts) {
                    var ids = opts.selectedValuesIds;

                    if (ids.length) {
                        self.locationFilter.subRegion = {type: 'ObjectId', values: ids};

                        delete self.locationFilter.outlet;
                        delete self.locationFilter.retailSegment;
                        delete self.locationFilter.branch;
                    } else {
                        delete self.locationFilter.subRegion;
                    }

                    self.resetLocations({
                        notSubRegion: true,
                        notRegion   : true,
                        notCountry  : true
                    });
                }, self);

                self.retailSegmentDropDown.on('changeItem', function (opts) {
                    var ids = opts.selectedValuesIds;

                    if (ids.length) {
                        self.locationFilter.retailSegment = {type: 'ObjectId', values: ids};

                        delete self.locationFilter.outlet;
                        delete self.locationFilter.branch;
                    } else {
                        delete self.locationFilter.retailSegment;
                    }

                    self.resetLocations({
                        notRetailSegment: true,
                        notSubRegion    : true,
                        notRegion       : true,
                        notCountry      : true
                    });
                }, self);

                self.outletDropDown.on('changeItem', function (opts) {
                    var ids = opts.selectedValuesIds;

                    if (ids.length) {
                        self.locationFilter.outlet = {type: 'ObjectId', values: ids};

                        delete self.locationFilter.branch;
                    } else {
                        delete self.locationFilter.outlet;
                    }

                    self.resetLocations({
                        notOutlet       : true,
                        notRetailSegment: true,
                        notSubRegion    : true,
                        notRegion       : true,
                        notCountry      : true
                    });
                }, self);

                self.branchDropDown.on('changeItem', function (opts) {
                    var ids = opts.selectedValuesIds;

                    if (ids.length) {
                        self.locationFilter.branch = {type: 'ObjectId', values: ids};
                    } else {
                        delete self.locationFilter.branch;
                    }

                    self.resetLocations({
                        notBranch       : true,
                        notOutlet       : true,
                        notRetailSegment: true,
                        notSubRegion    : true,
                        notRegion       : true,
                        notCountry      : true
                    });
                }, self);

            });

        },

        resetLocations: function (options) {
            var self = this;

            dataService.getData('/filters/promotions/location', {filter: this.locationFilter}, function (err, result) {
                if (err) {
                    return console.dir(err);
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
                yearRange  : '-20y:c+10y',
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
                yearRange  : '-20y:c+10y',
                minDate    : new Date(dateStart),
                maxDate    : new Date(endDate),
                defaultDate: new Date(endDate),
                onClose    : function (selectedDate) {
                    $startDate.datepicker('option', 'maxDate', selectedDate);
                }
            });

            implementShowHideArabicInputIn(this);

            this.categoryCollection = new CategoryCollection({archived: false});
            this.categoryCollection.on('reset', function () {
                populate.inputDropDown({
                    selector   : '#categoryDd',
                    context    : this,
                    contentType: 'category',
                    collection : this.categoryCollection.toJSON(),
                    forPosition: true,
                    displayText: this.translation.category
                });
            }, this);

            this.renderLocations();

            this.displayTypeCollection = new DisplayTypeCollection();
            this.displayTypeCollection.on('reset', function () {
                populate.inputDropDown({
                    selector   : '#displayTypeDd',
                    context    : this,
                    contentType: 'displayType',
                    displayText: this.translation.displayType,
                    collection : this.displayTypeCollection.toJSON(),
                    forPosition: true,
                    multiSelect: true,
                    showSelectAll : true
                });
            }, this);

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
