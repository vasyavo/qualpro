define([
    'Backbone',
    'Underscore',
    'jQuery',
    'text!templates/contractsSecondary/create.html',
    'text!templates/file/preView.html',
    'views/baseDialog',
    'views/objectives/fileDialogView',
    'models/contractsSecondary',
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
    'helpers/implementShowHideArabicInputIn',
    'views/filter/dropDownView',
    'views/documents/createView',
    'constants/otherConstants',
    'moment',
    'dataService',
    'validation',
    'collections/displayType/collection',
    'constants/contentType'
], function (Backbone, _, $, CreateTemplate, FileTemplate, BaseView, FileDialogView,
             Model, populate, FileCollection, FileModel, CategoryCollection,
             CountryModel, RegionModel, SubRegionModel, RetailSegmentModel, OutletModel, BranchModel,
             implementShowHideArabicInputIn, DropDownView, NewDocView, CONSTANTS, moment, dataService,
             validation, DisplayTypeCollection, CONTENT_TYPES) {
    'use strict';

    var CreateView = BaseView.extend({
        contentType : CONTENT_TYPES.CONTRACTSSECONDARY,
        template    : _.template(CreateTemplate),
        fileTemplate: _.template(FileTemplate),
        body        : {},

        events: {
            'click #attachFile': 'showAttachDialog'
        },

        initialize: function (options) {
            this.files = new FileCollection();
            this.locationFilter = {};
            this.model = new Model();
            this.translation = options.translation;

            var self = this;

            this.makeRender();

            dataService.getData('documents', {}, function (err, response) {
                var documents = response.data;
                var attachments;

                attachments = _.map(documents, function (document) {
                    var title = document.title;
                    var attachments = document.attachments;
                    var attach = attachments;

                    attach.originalName = title;
                    attach['document'] = document._id;

                    return attach;

                });

                if (err) {
                    return App.render({type: 'error', message: err.message});
                }

                self.files.setAndUpdateModels(attachments, false);
                self.render();
            });

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

        saveContract: function (options, cb) {
            var model = this.model.toJSON();
            var $curEl = this.$el;
            var self = this;
            var attachments;
            var description = {
                en: $curEl.find('.objectivesTextarea[data-property="en"]').val(),
                ar: $curEl.find('.objectivesTextarea[data-property="ar"]').val()
            };
            var arrForVal = ['activity', 'promotion', 'budget', 'actual', 'salesTarget', 'dateStart', 'dateEnd'];
            var arrForDate = ['dateStart', 'dateEnd'];
            var keys = _.union(['country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'type', 'category', 'displayType'], arrForVal);

            keys.forEach(function (key) {
                var attr = _.indexOf(arrForVal, key) === -1 ? true : false;
                var date = _.indexOf(arrForDate, key) === -1 ? false : true;
                self.checkValue(key, attr, date, model);
            });

            this.body.description = description;

            attachments = _.pluck(this.files.getParent({
                parent: true,
                models: this.files.getSelected({selected: true}),
                json  : true
            }), '_id');

            this.body.attachments = attachments.length ? attachments : null;

            this.body.saveContractsSecondary = options.save;

            this.model.setFieldsNames(this.translation);

            this.model.validate(this.body, function (err) {
                if (err && err.length) {
                    App.renderErrors(err);
                } else {
                    self.formSubmit();
                    cb();
                }
            });
        },

        formSubmit: function (e) {
            var context = this;
            var data = context.formData;

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
            var options = {
                files      : this.files,
                buttonName : this.translation.attachButtonName,
                haveParent : true,
                contentType: this.contentType,
                dialogTitle: this.translation.dialogTitle,
                rightTitle : this.translation.rightTitle,
                translation: this.translation
            };

            this.fileDialogView = new FileDialogView(options);
            this.fileDialogView.on('clickAttachFileButton', this.attachFile, this);
            this.fileDialogView.on('addFile', this.addFile, this);
            this.fileDialogView.on('removeFile', this.removeFile, this);
        },

        removeFile: function (file) {
            var $curEl = this.$el;
            var $thumbnail = $curEl.find('.fileThumbnailItem[data-id = "' + (file.id || file.cid) + '"]');

            $thumbnail.remove();

            if (!file.get('uploaded') || !file.get('contentType')) {
                this.files.remove(file, {silent: true});
                this.formData.delete(file.cid);
            }
            $curEl.find('#' + (file.id || file.cid)).remove();

        },

        fileSelected: function (e) {
            var self = this;
            var data = e.data;
            var $fileInput = $(data.fileInput);
            var fileCid = $fileInput.attr('id');
            var fileModel = this.files.get(fileCid);
            var reader = new FileReader();

            reader.readAsDataURL(e.target.files[0]);
            reader.onload = function (e) {
                var result = e.target.result;
                if (!result) {
                    self.files.remove(fileModel);
                    return;
                }
                var type = $fileInput.prop('files')[0].type;
                var selectedFile = {
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

                var model = fileModel.toJSON();
                model['cid'] = fileCid;

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
            var self = this;

            this.newDocumentView = new NewDocView({
                contract   : true,
                translation: this.translation
            });

            this.newDocumentView.on('contract', function (options) {
                var inputModel = options.inputModel;
                inputModel.set('originalName', options.title);
                fileInput = this.$el.find('#' + inputModel.cid);
                self.files.add(inputModel);

                self.formData.append(options.title, fileInput[0].files[0]);
                var model = inputModel.toJSON();
                model['cid'] = inputModel.cid;
                model['name'] = options.title;

                self.$el.find('#fileThumbnail').append(self.fileTemplate({
                    model: model
                }));

                self.$el.find('#filesBlock').show();
                self.fileDialogView.trigger('fileSelected', inputModel);
            });
        },

        addFile: function (file) {
            var $curEl = this.$el;
            var jsonModel = file.toJSON();

            $curEl.find('#fileThumbnail').append(this.fileTemplate({
                model: jsonModel
            }));
            $curEl.find('.filesBlock').show();
        },

        renderLocations: function () {
            var self = this;
            var $el = this.$el;

            dataService.getData('/filters/contractsSecondary/location', {filter: this.locationFilter}, function (err, result) {
                if (err) {
                    return console.dir(err);
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

                self.countryDropDown = new DropDownView({
                    dropDownList       : self.countryCollection,
                    displayText        : self.translation.selectCountry,
                    contentType        : 'country',
                    singleUnselect     : true,
                    noSingleSelectEvent: true,
                    noAutoSelectOne    : true
                });
                $el.find('#countryDd').replaceWith(self.countryDropDown.el);

                self.regionDropDown = new DropDownView({
                    dropDownList       : self.regionCollection,
                    displayText        : self.translation.selectRegion,
                    contentType        : 'region',
                    multiSelect        : true,
                    noSingleSelectEvent: true,
                    noAutoSelectOne    : true
                });
                $el.find('#regionDd').replaceWith(self.regionDropDown.el);

                self.subRegionDropDown = new DropDownView({
                    dropDownList       : self.subRegionCollection,
                    displayText        : self.translation.selectSubRegion,
                    contentType        : 'subRegion',
                    multiSelect        : true,
                    noSingleSelectEvent: true,
                    noAutoSelectOne    : true
                });
                $el.find('#subRegionDd').replaceWith(self.subRegionDropDown.el);

                self.retailSegmentDropDown = new DropDownView({
                    dropDownList       : self.retailSegmentCollection,
                    displayText        : self.translation.selectRetailSegment,
                    contentType        : 'retailSegment',
                    multiSelect        : true,
                    noSingleSelectEvent: true,
                    noAutoSelectOne    : true
                });
                $el.find('#retailSegmentDd').replaceWith(self.retailSegmentDropDown.el);

                self.outletDropDown = new DropDownView({
                    dropDownList       : self.outletCollection,
                    displayText        : self.translation.selectOutlet,
                    contentType        : 'outlet',
                    multiSelect        : true,
                    noSingleSelectEvent: true,
                    noAutoSelectOne    : true
                });
                $el.find('#outletDd').replaceWith(self.outletDropDown.el);

                self.branchDropDown = new DropDownView({
                    dropDownList       : self.branchCollection,
                    displayText        : self.translation.selectBranch,
                    contentType        : 'branch',
                    multiSelect        : true,
                    noSingleSelectEvent: true,
                    noAutoSelectOne    : true
                });
                $el.find('#branchDd').replaceWith(self.branchDropDown.el);


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
                    } else {
                        delete self.locationFilter.country;
                    }

                    self.resetLocations({notCountry: true});
                }, self);

                self.regionDropDown.on('changeItem', function (opts) {
                    var ids = opts.selectedValuesIds;

                    if (ids.length) {
                        self.locationFilter.region = {type: 'ObjectId', values: ids};
                    } else {
                        delete self.locationFilter.region;
                    }

                    self.resetLocations({notRegion: true});
                }, self);

                self.subRegionDropDown.on('changeItem', function (opts) {
                    var ids = opts.selectedValuesIds;

                    if (ids.length) {
                        self.locationFilter.subRegion = {type: 'ObjectId', values: ids};
                    } else {
                        delete self.locationFilter.subRegion;
                    }

                    self.resetLocations({notSubRegion: true});
                }, self);

                self.retailSegmentDropDown.on('changeItem', function (opts) {
                    var ids = opts.selectedValuesIds;

                    if (ids.length) {
                        self.locationFilter.retailSegment = {type: 'ObjectId', values: ids};
                    } else {
                        delete self.locationFilter.retailSegment;
                    }

                    delete self.locationFilter.outlet;
                    delete self.locationFilter.branch;

                    self.resetLocations({notRetailSegment: true});
                }, self);

                self.outletDropDown.on('changeItem', function (opts) {
                    var ids = opts.selectedValuesIds;

                    if (ids.length) {
                        self.locationFilter.outlet = {type: 'ObjectId', values: ids};
                    } else {
                        delete self.locationFilter.outlet;
                    }

                    delete self.locationFilter.branch;

                    self.resetLocations({
                        notOutlet       : true,
                        notRetailSegment: true
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
                        notRetailSegment: true
                    });
                }, self);
            });
        },

        resetLocations: function (options) {
            var self = this;

            dataService.getData('/filters/contractsSecondary/location', {filter: this.locationFilter}, function (err, result) {
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
            var dateStart;
            var dateEnd;
            var actuallyDate = new Date();
            var $startDate;
            var $endDate;
            var $curEl;


            this.$el = $(formString).dialog({
                dialogClass: 'create-dialog full-height-dialog',
                title      : this.translation.createTitle,
                width      : '1000',
                buttons    : {
                    send  : {
                        text : this.translation.publishBtn,
                        class: 'btn sendBtn',
                        click: function () {
                            var that = this;

                            self.saveContract({save: false}, function () {
                                $(that).dialog('destroy').remove();
                            });
                        }
                    },
                    cancel: {
                        text: this.translation.cancelBtn
                    },
                    save  : {
                        text : this.translation.saveBtn,
                        class: 'btn saveBtn',
                        click: function () {
                            var that = this;

                            self.saveContract({save: true}, function () {
                                $(that).dialog('destroy').remove();
                            });
                        }
                    }
                }
            });

            $curEl = this.$el;

            $curEl.find('#' + idToHide).hide();
            $curEl.find('#filesBlock').hide();

            this.formData = new FormData();

            $startDate = $curEl.find('#dateStart');
            $endDate = $curEl.find('#dateEnd');

            $startDate.datepicker({
                changeMonth: true,
                changeYear : true,
                yearRange  : '-20y:c+10y',
                minDate    : new Date(dateStart),
                maxDate    : new Date(dateEnd),
                defaultDate: new Date(actuallyDate),
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

            if (!this.duplicate) {
                this.contractsStatuses = CONSTANTS.CONTRACTS_UI_STATUSES;
            } else {
                this.contractsStatuses = [CONSTANTS.CONTRACTS_UI_STATUSES[0], CONSTANTS.CONTRACTS_UI_STATUSES[1]];

            }

            this.categoryCollection = new CategoryCollection({archived: false});
            this.categoryCollection.on('reset', function () {
                populate.inputDropDown({
                    selector   : '#categoryDd',
                    context    : this,
                    contentType: 'category',
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
                    contentType: 'displayType',
                    displayText: this.translation.displayType,
                    collection : this.displayTypeCollection.toJSON(),
                    forPosition: true
                });
            }, this);

            this.contractTypes = CONSTANTS.CONTRACTS_SECONDARY_TYPE;
            populate.inputDropDown({
                selector   : '#typeDd',
                context    : this,
                contentType: 'type',
                displayText: this.translation.type,
                collection : this.contractTypes
            });

            populate.inputDropDown({
                selector    : '#statusDd',
                context     : this,
                contentType : 'status',
                displayModel: this.contractsStatuses[0],
                collection  : this.contractsStatuses
            });

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
