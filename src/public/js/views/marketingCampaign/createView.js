define([
    'backbone',
    'jQuery',
    'Underscore',
    'constants/contentType',
    'text!templates/marketingCampaign/create.html',
    'text!templates/file/preView.html',
    'views/baseDialog',
    'views/objectives/fileDialogView',
    'views/filter/dropDownView',
    'models/file',
    'models/country',
    'models/region',
    'models/subRegion',
    'models/retailSegment',
    'models/outlet',
    'models/branch',
    'models/parrent',
    'models/marketingCampaign',
    'populate',
    'collections/file/collection',
    'collections/category/collection',
    'collections/notifications/collection',
    'helpers/implementShowHideArabicInputIn',
    'constants/otherConstants',
    'moment',
    'dataService',
    'collections/displayType/collection',
    'constants/errorMessages'
], function (Backbone, $, _, CONTENT_TYPES, CreateTemplate, FileTemplate, BaseView, FileDialogView, DropDownView,
             FileModel, CountryModel, RegionModel, SubRegionModel, RetailSegmentModel, OutletModel, BranchModel,
             ParentModel, Model, populate, FileCollection, CategoryCollection, notificationsCollection,
             implementShowHideArabicInputIn, CONSTANTS, moment, dataService, DisplayTypeCollection, ERROR_MESSAGES) {

    var CreateView = BaseView.extend({
        contentType          : CONTENT_TYPES.MARKETING_CAMPAIGN,
        template             : _.template(CreateTemplate),
        fileTemplate         : _.template(FileTemplate),
        imageSrc             : '',
        ALLOWED_CONTENT_TYPES: _.union(CONSTANTS.IMAGE_CONTENT_TYPES, CONSTANTS.MS_WORD_CONTENT_TYPES, CONSTANTS.MS_EXCEL_CONTENT_TYPES, CONSTANTS.OTHER_FORMATS),

        events: {
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

        checkValue: function (key, attr, date, model) {
            var $curEl = this.$el;
            var el = date ? $curEl.find('#' + key) : $curEl.find('#' + key + 'Dd');
            var value = attr ? el.attr('data-id') : el.val();

            if (date && value) {
                value = moment(value, 'DD.MM.YYYY, h:mm:ss');
                value = key === 'dateStart' ? value.set('hour', 0).set('minute', 1) : value.set('hour', 23).set('minute', 59);
            }

            this.body[key] = value;
        },

        saveBrandingAndDisplay: function (options, cb) {
            var model = this.model.toJSON();
            var $curEl = this.$el;
            var self = this;
            var attachments = this.files;
            var description = {
                en: $curEl.find('.objectivesTextarea[data-property="en"]').val(),
                ar: $curEl.find('.objectivesTextarea[data-property="ar"]').val()
            };
            var arrForDate = ['dateStart', 'dateEnd'];
            var keys = _.union(['country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'category', 'displayType'], arrForDate);
            this.body = {};
            this.checkForEmptyInput(this.files, this.$el);

            keys.forEach(function (key) {
                var attr = _.indexOf(arrForDate, key) === -1;
                var date = _.indexOf(arrForDate, key) !== -1;
                self.checkValue(key, attr, date, model);
            });

            this.body.description = description;

            this.body.save = options.save;

            this.body.attachments = attachments.length ? attachments : [];

            if (this.linkedForm) {
                this.body.formType = this.linkedForm._id;
            }

            this.model.setFieldsNames(this.translation);

            this.model.validate(this.body, function (err) {
                if (err && err.length) {
                    App.renderErrors(err);
                } else {
                    delete self.body.attachments;

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
                success    : function (model) {
                    var newModel = new Model(model, {parse: true});

                    context.trigger('modelSaved', newModel);
                }
            });
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

        attachFile: function () {
            var fileInput;
            var fileModel = new FileModel();

            this.files.add(fileModel);
            this.$el.find('#mainForm').append('<input accept="' + this.ALLOWED_CONTENT_TYPES.join(', ') + '" type="file" name="' + fileModel.cid + '" id="' + fileModel.cid + '" style="display: none">');
            fileInput = this.$el.find('#' + fileModel.cid);
            fileInput.on('change', {fileInput: fileInput}, this.fileSelected);
            fileInput.click();
        },

        fileSelected: function (e) {
            var currentLanguage = App.currentUser.currentLanguage;
            var self = this;
            var data = e.data;
            var $fileInput = $(data.fileInput);
            var $curEl = this.$el;
            var fileCid = $fileInput.attr('id');
            var fileModel = this.files.get(fileCid);
            var reader = new FileReader();
            var selectedFile;
            var model;
            var type;
            reader.readAsDataURL(e.target.files[0]);
            reader.onload = function (elem) {
                var result = elem.target.result;
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

                $curEl.find('#fileThumbnail').append(self.fileTemplate({
                    model: model
                }));

                $curEl.find('.filesBlock').show();
                self.fileDialogView.trigger('fileSelected', fileModel);

                App.masonryGrid.call(self.$el);
            };

        },

        removeFile: function (file) {
            var fileId = file.get('_id') || file.cid;
            var $thumbnail = this.$el.find('.fileThumbnailItem[data-id = "' + fileId + '"]');

            $thumbnail.remove();

            this.files.remove(file, {silent: true});
            this.$el.find('#' + file.cid).remove();

        },

        renderLocations: function () {
            var self = this;
            var comparator = function (model) {
                return model.get('name').currentLanguage;
            };

            dataService.getData('/filters/brandingActivityCreate', {filter: self.locationFilter}, function (err, result) {
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
                    contentType        : CONTENT_TYPES.COUNTRY,
                    noSingleSelectEvent: true,
                    noAutoSelectOne    : true
                });
                self.$el.find('#countryDd').replaceWith(self.countryDropDown.el);

                self.regionDropDown = new DropDownView({
                    dropDownList       : self.regionCollection,
                    displayText        : self.translation.selectRegion,
                    contentType        : CONTENT_TYPES.REGION,
                    multiSelect        : true,
                    noSingleSelectEvent: true,
                    noAutoSelectOne    : true,
                    showSelectAll      : true
                });
                self.$el.find('#regionDd').replaceWith(self.regionDropDown.el);

                self.subRegionDropDown = new DropDownView({
                    dropDownList       : self.subRegionCollection,
                    displayText        : self.translation.selectSubRegion,
                    contentType        : CONTENT_TYPES.SUBREGION,
                    multiSelect        : true,
                    noSingleSelectEvent: true,
                    noAutoSelectOne    : true,
                    showSelectAll      : true
                });
                self.$el.find('#subRegionDd').replaceWith(self.subRegionDropDown.el);

                self.retailSegmentDropDown = new DropDownView({
                    dropDownList       : self.retailSegmentCollection,
                    displayText        : self.translation.selectRetailSegment,
                    contentType        : CONTENT_TYPES.RETAILSEGMENT,
                    multiSelect        : true,
                    noSingleSelectEvent: true,
                    noAutoSelectOne    : true,
                    showSelectAll      : true
                });
                self.$el.find('#retailSegmentDd').replaceWith(self.retailSegmentDropDown.el);

                self.outletDropDown = new DropDownView({
                    dropDownList       : self.outletCollection,
                    displayText        : self.translation.selectOutlet,
                    contentType        : CONTENT_TYPES.OUTLET,
                    multiSelect        : true,
                    noSingleSelectEvent: true,
                    noAutoSelectOne    : true,
                    showSelectAll      : true
                });
                self.$el.find('#outletDd').replaceWith(self.outletDropDown.el);

                self.branchDropDown = new DropDownView({
                    dropDownList       : self.branchCollection,
                    displayText        : self.translation.selectBranch,
                    contentType        : CONTENT_TYPES.BRANCH,
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

                    self.locationFilter = {};

                    if (id) {
                        self.locationFilter.country = {type: 'ObjectId', values: [id]};
                    }

                    self.resetLocations({});
                }, self);

                self.regionDropDown.on('changeItem', function (opts) {
                    var ids = opts.selectedValuesIds;

                    self.locationFilter = _.pick(self.locationFilter, 'country');

                    if (ids.length) {
                        self.locationFilter.region = {type: 'ObjectId', values: ids};
                    }

                    self.resetLocations({region: true});
                }, this);

                self.subRegionDropDown.on('changeItem', function (opts) {
                    var ids = opts.selectedValuesIds;

                    self.locationFilter = _.pick(self.locationFilter, 'country', 'region');

                    if (ids.length) {
                        self.locationFilter.subRegion = {type: 'ObjectId', values: ids};
                    }

                    self.resetLocations({
                        region   : true,
                        subRegion: true
                    });
                }, this);

                self.retailSegmentDropDown.on('changeItem', function (opts) {
                    var ids = opts.selectedValuesIds;

                    self.locationFilter = _.pick(self.locationFilter, 'country', 'region', 'subRegion');

                    if (ids.length) {
                        self.locationFilter.retailSegment = {type: 'ObjectId', values: ids};
                    }

                    self.resetLocations({
                        region       : true,
                        subRegion    : true,
                        retailSegment: true
                    });
                }, self);

                self.outletDropDown.on('changeItem', function (opts) {
                    var ids = opts.selectedValuesIds;

                    self.locationFilter = _.pick(self.locationFilter, 'country', 'region', 'subRegion', 'retailSegment');

                    if (ids.length) {
                        self.locationFilter.outlet = {type: 'ObjectId', values: ids};
                    }

                    self.resetLocations({
                        region       : true,
                        subRegion    : true,
                        retailSegment: true,
                        outlet       : true
                    });
                }, self);

                self.branchDropDown.on('changeItem', function (opts) {
                    var ids = opts.selectedValuesIds;

                    self.locationFilter = _.pick(self.locationFilter, 'country', 'region', 'subRegion', 'retailSegment', 'outlet');

                    if (ids.length) {
                        self.locationFilter.branch = {type: 'ObjectId', values: ids};
                    }

                    self.resetLocations({
                        region       : true,
                        subRegion    : true,
                        retailSegment: true,
                        outlet       : true,
                        branch       : true
                    });

                }, self);
            });
        },

        resetLocations: function (options) {
            var self = this;

            dataService.getData('/filters/brandingActivityCreate', {filter: self.locationFilter},
                function (err, result) {
                    if (err) {
                        return App.render(err);
                    }

                    // if (!options.country) {
                    //     self.countryDropDown.collection.reset(result.country, {parse: true});
                    // }
                    if (!options.region) {
                        self.regionDropDown.collection.reset(result.region, {parse: true});
                        self.regionDropDown.removeSelected();
                    }
                    if (!options.subRegion) {
                        self.subRegionDropDown.collection.reset(result.subRegion, {parse: true});
                        self.subRegionDropDown.removeSelected();
                    }
                    if (!options.retailSegment) {
                        self.retailSegmentDropDown.collection.reset(result.retailSegment, {parse: true});
                        self.retailSegmentDropDown.removeSelected();
                    }
                    if (!options.outlet) {
                        self.outletDropDown.collection.reset(result.outlet, {parse: true});
                        self.outletDropDown.removeSelected();
                    }
                    if (!options.branch) {
                        self.branchDropDown.collection.reset(result.branch, {parse: true});
                        self.branchDropDown.removeSelected();
                    }
                });
        },

        render: function () {
            var jsonModel = this.model.toJSON();
            var formString = this.template({
                jsonModel  : jsonModel,
                translation: this.translation
            });
            var self = this;
            var dateStart = new Date();
            var anotherLanguage = App.currentUser.currentLanguage === 'en' ? 'Ar' : 'En';
            var idToHide = 'description' + anotherLanguage + 'Container';
            var dateEnd;
            var $startDate;
            var $endDate;
            var $curEl;

            this.$el = $(formString).dialog({
                dialogClass: 'create-dialog full-height-dialog',
                title      : this.translation.createTitle,
                width      : '1000',
                buttons    : {
                    send: {
                        text : this.translation.saveBtn,
                        class: 'btn sendBtn',
                        click: function () {
                            var that = this;

                            self.saveBrandingAndDisplay({save: true}, function () {
                                $(that).dialog('destroy').remove();
                            });
                        }
                    },
                    save: {
                        text : this.translation.publishBtn,
                        class: 'btn sendBtn',
                        click: function () {
                            var that = this;

                            self.saveBrandingAndDisplay({save: false}, function () {
                                $(that).dialog('destroy').remove();
                            });
                        }
                    }
                }
            });

            $curEl = this.$el;

            $curEl.find('#' + idToHide).hide();
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

            this.categoryCollection = new CategoryCollection({archived: false});
            this.categoryCollection.on('reset', function () {
                populate.inputDropDown({
                    selector   : '#categoryDd',
                    context    : this,
                    contentType: CONTENT_TYPES.CATEGORY,
                    displayText: this.translation.selectCategory,
                    multiSelect: true,
                    collection : this.categoryCollection.toJSON()
                });
            }, this);

            this.renderLocations();

            this.displayTypeCollection = new DisplayTypeCollection();
            this.displayTypeCollection.on('reset', function () {
                populate.inputDropDown({
                    selector   : '#displayTypeDd',
                    context    : this,
                    contentType: CONTENT_TYPES.DISPLAYTYPE,
                    displayText: this.translation.displayType,
                    collection : this.displayTypeCollection.toJSON(),
                    forPosition: true,
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
