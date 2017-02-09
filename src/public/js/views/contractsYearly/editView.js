define([
    'backbone',
    'Underscore',
    'jQuery',
    'text!templates/contractsYearly/edit.html',
    'text!templates/file/preView.html',
    'views/baseDialog',
    'views/objectives/fileDialogView',
    'models/contractsYearly',
    'populate',
    'collections/file/collection',
    'models/file',
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
    'constants/contentType'
], function (Backbone, _, $, EditTemplate, FileTemplate, BaseView, FileDialogView,
             Model, populate, FileCollection, FileModel,
             CountryModel, RegionModel, SubRegionModel, RetailSegmentModel, OutletModel, BranchModel,
             implementShowHideArabicInputIn, DropDownView, NewDocumentView, CONSTANTS, moment, dataService, CONTENT_TYPES) {
    'use strict';

    var CreateView = BaseView.extend({
        contentType : CONTENT_TYPES.CONTRACTSYEARLY,
        template    : _.template(EditTemplate),
        fileTemplate: _.template(FileTemplate),
        updateCount : 0,

        events: {
            'click #attachFile': 'showAttachDialog'
        },

        initialize: function (options) {
            options = options || {};
            var self = this;
            this.translation = options.translation;
            this.locationFilter = {};
            this.duplicate = options.duplicate;
            this.attachments = _.pluck(this.model.toJSON().attachments, '_id');
            this.files = new FileCollection();
            this.makeRender();

            dataService.getData('documents', {}, function (err, response) {
                var documents = response.data;
                var attachments;

                attachments = _.map(documents, function (document) {
                    var title = document.title;
                    attachments = document.attachments;
                    var attach = attachments;

                    attach.originalName = title;
                    attach.document = document._id;


                    return attach;

                });

                if (err) {
                    return App.render({type: 'error', message: err.message});
                }

                self.files.setAndUpdateModels(attachments, false);
                if (!self.duplicate) {
                    self.setChecked();
                    self.render();
                    self.setSelectedFiles();
                } else {
                    self.render();
                }
            });
            this.attachments = [];

            _.bindAll(this, 'fileSelected');
        },

        setChecked: function () {
            var self = this;
            var modelJSON = this.model.toJSON();
            var attachments = modelJSON.attachments;
            var files = this.files.toJSON();
            attachments.forEach(function (attach) {
                var file = _.findWhere(files, {document: attach._id});
                if (file) {
                    self.files.get(file).set('selected', true);
                }
            });
        },

        checkValue: function (key, attr, date, model) {
            var $curEl = this.$el;
            var el = date ? $curEl.find('#' + key) : $curEl.find('#' + key + 'Dd');
            var value = attr ? el.attr('data-id') : el.val();

            var condition;

            if (_.indexOf(['branch', 'outlet', 'region', 'subRegion', 'retailSegment'], key) !== -1) {
                condition = true;

                if (!model[key]) {
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
            } else if (key === 'type') {
                condition = value === model[key].toString();
            } else {
                if (!model[key]) {
                    condition = false;
                } else {
                    condition = attr ? value === model[key]._id.toString() : value === model[key].toString();
                }
            }
            if (date && !condition) {
                value = moment(value, 'DD.MM.YYYY, h:mm:ss');
                value = key === 'dateStart' ? value.set('hour', 0).set('minute', 1) : value.set('hour', 23).set('minute', 59);
                this.body[key] = value;
                return;
            }

            if (!condition) {
                this.body[key] = value;
            }
        },

        checkIfDuplicate: function (model) {
            var body = this.body;
            var keysToSimpleCopy = ['type', 'description', 'status'];
            var keysToGetId = ['country'];
            keysToSimpleCopy = _.difference(keysToSimpleCopy, Object.keys(this.body));
            keysToGetId = _.difference(keysToGetId, Object.keys(this.body));

            if (keysToSimpleCopy.length) {
                keysToSimpleCopy.forEach(function (key) {
                    body[key] = model[key];
                });
            }
            if (keysToGetId.length) {
                keysToGetId.forEach(function (key) {
                    body[key] = model[key]._id;
                });
            }
        },

        saveContractsYearly: function (options, cb) {
            var model = this.model.toJSON();
            var self = this;
            var $curEl = this.$el;
            var description = {
                en: $curEl.find('.objectivesTextarea[data-property="en"]').val(),
                ar: $curEl.find('.objectivesTextarea[data-property="ar"]').val()
            };
            var arrForDate = ['dateStart', 'dateEnd'];
            var keys = _.union(['country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'type'], arrForDate);
            var modelStatus = this.model.get('status');
            var statusBoolean = modelStatus._id === 'draft';
            var selectedFiles;
            var attachments;
            var files;
            var change;
            this.body = {};

            keys.forEach(function (key) {
                var attr = _.indexOf(arrForDate, key) === -1;
                var date = _.indexOf(arrForDate, key) !== -1;
                self.checkValue(key, attr, date, model);
            });

            if (description.ar !== model.description.ar || description.en !== model.description.en) {
                this.body.description = description;
            }

            if (this.duplicate) {
                self.checkIfDuplicate(model);
            }

            files = this.files.toJSON();
            attachments = _.pluck(model.attachments, '_id');
            selectedFiles = _.where(files, {selected: true});
            selectedFiles = _.pluck(selectedFiles, 'document');

            if (selectedFiles.length) {
                change = _.difference(selectedFiles, attachments);
                if (change.length || selectedFiles.length !== attachments.length) {
                    this.body.attachments = selectedFiles;
                }
            } else {
                this.body.attachments = null;
            }

            this.body.saveContractsYearly = !statusBoolean && options.save ? false : options.save;

            if (statusBoolean === this.body.saveContractsYearly && Object.keys(this.body).length === 1) {
                delete this.body.saveContractsYearly;
            }

            if (!Object.keys(this.body).length && !this.updateCount && change) {
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

                    self.formSubmit();
                    cb();
                }
            });
        },

        formSubmit: function (e) {
            var context = this;
            var data = context.formData;
            var ajaxData = {
                data       : data,
                contentType: false,
                processData: false,
                success    : function (xhr) {
                    var model = new Model(xhr, {parse: true});

                    context.trigger('modelSaved', model);
                }
            };


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
            var fileId = file.get('_id') || file.cid;
            var $thumbnail = $curEl.find('.fileThumbnailItem[data-id = "' + fileId + '"]');
            if (!$thumbnail.length) {
                $thumbnail = $curEl.find('.fileThumbnailItem[data-id = "' + file.get('document') + '"]');
            }
            $thumbnail.remove();

            if (!file.get('uploaded') || !file.get('contentType')) {
                this.files.remove(file, {silent: true});
                $curEl.find('#' + file.cid).remove();
                this.formData.delete(file.cid);
            }

        },

        setSelectedFiles: function () {
            var self = this;
            var model = this.model.toJSON();

            model.documents.forEach(function (attachment) {
                self.$el.find('#fileThumbnail').append(self.fileTemplate({
                    model: attachment
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
            var fileModel = data.fileModel;

            var reader = new FileReader();

            reader.readAsDataURL(e.target.files[0]);
            reader.onload = function (elem) {
                var result = elem.target.result;
                var selectedFile;
                var type;
                var model;
                if (!result) {
                    fileModel.remove();
                    return;
                }

                type = $fileInput.prop('files')[0].type;
                selectedFile = {
                    name: $fileInput.prop('files')[0].name,
                    type: type
                };

                self.files.add(fileModel);
                fileModel = self.files.get(fileCid);

                fileModel.update({file: selectedFile});

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
            var self = this;

            this.newDocumentView = new NewDocumentView({
                contract   : true,
                translation: this.translation
            });

            this.newDocumentView.on('contract', function (options) {
                var inputModel = options.inputModel;
                var model;
                inputModel.set('originalName', options.title);
                fileInput = this.$el.find('#' + inputModel.cid);
                self.files.add(inputModel);
                self.formData.append(options.title, fileInput[0].files[0]);
                model = inputModel.toJSON();
                model.cid = inputModel.cid;
                model.name = options.title;

                self.$el.find('#fileThumbnail').append(self.fileTemplate({
                    model: model
                }));

                self.$el.find('#filesBlock').show();
                self.fileDialogView.trigger('fileSelected', inputModel);
            });
        },

        addFile: function (file) {
            var $curEl = this.$el;

            $curEl.find('#fileThumbnail').append(this.fileTemplate({
                model: file.toJSON()
            }));

            $curEl.find('.filesBlock').show();
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
            var $curEl = this.$el;


            this.locationFilter = {};
            this.locationFilter.country = {type: 'ObjectId', values: [countryId]};
            this.locationFilter.region = {type: 'ObjectId', values: regionIds};
            this.locationFilter.subRegion = {type: 'ObjectId', values: subRegionIds};
            this.locationFilter.retailSegment = {type: 'ObjectId', values: retailSegmentIds};
            this.locationFilter.outlet = {type: 'ObjectId', values: outletIds};
            this.locationFilter.branch = {type: 'ObjectId', values: branchIds};

            dataService.getData('/filters/contractsYearly/location', {
                edit  : true,
                filter: self.locationFilter
            }, function (err, result) {
                if (err) {
                    App.render(err);
                }

                self.countryCollection = new Backbone.Collection(result.country || {}, {
                    model: CountryModel,
                    parse: true
                });
                self.regionCollection = new Backbone.Collection(result.region || {}, {
                    model: RegionModel,
                    parse: true
                });
                self.subRegionCollection = new Backbone.Collection(result.subRegion || {}, {
                    model: SubRegionModel,
                    parse: true
                });
                self.retailSegmentCollection = new Backbone.Collection(result.retailSegment || {}, {
                    model: RetailSegmentModel,
                    parse: true
                });
                self.outletCollection = new Backbone.Collection(result.outlet || {}, {
                    model: OutletModel,
                    parse: true
                });
                self.branchCollection = new Backbone.Collection(result.branch || {}, {
                    model: BranchModel,
                    parse: true
                });

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
                    var ids = opts.selectedValuesIds;
                    delete self.locationFilter.outlet;
                    delete self.locationFilter.branch;

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
                    delete self.locationFilter.branch;

                    if (ids.length) {
                        self.locationFilter.outlet = {type: 'ObjectId', values: ids};
                        self.resetLocations({
                            notOutlet       : true,
                            notRetailSegment: true,
                            currentCT       : 'outlet'
                        });
                    } else {
                        delete self.locationFilter.outlet;
                        self.resetLocations({notOutlet: false, currentCT: 'outlet'});
                    }
                }, self);

                self.branchDropDown.on('changeItem', function (opts) {
                    var ids = opts.selectedValuesIds;

                    if (ids.length) {
                        self.locationFilter.branch = {type: 'ObjectId', values: ids};
                        self.resetLocations({
                            notBranch       : true,
                            notOutlet       : true,
                            notRetailSegment: true,
                            currentCT       : 'branch'
                        });
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

            dataService.getData('/filters/contractsYearly/location', {filter: this.locationFilter}, function (err, result) {
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
            var $endDate;
            var startDateObj;
            var endDateObj;
            var $curEl;
            var defaultType;


            var buttons = {
                send: {
                    text : this.translation.publishBtn,
                    class: 'btn sendBtn',
                    click: function () {
                        var that = this;

                        self.saveContractsYearly({save: false}, function () {
                            $(that).dialog('destroy').remove();
                        });
                    }
                },

                save: {
                    text : self.translation.saveBtn,
                    class: 'btn saveBtn',
                    click: function () {
                        var that = this;
                        self.saveContractsYearly({save: true}, function () {
                            $(that).dialog('destroy').remove();
                        });
                    }
                },

                cancel: {
                    text: self.translation.cancelBtn
                }
            };

            if (self.duplicate || jsonModel.status._id === 'draft') {
                buttons.send = {
                    text : self.translation.publishBtn,
                    class: 'btn sendBtn',
                    click: function () {
                        var that = this;

                        self.saveContractsYearly({save: false}, function () {
                            $(that).dialog('destroy').remove();
                        });
                    }
                };
            }

            jsonModel.duplicate = self.duplicate;
            formString = self.template({jsonModel: jsonModel, translation: self.translation});

            self.$el = $(formString).dialog({
                dialogClass: 'create-dialog full-height-dialog',
                title      : self.translation.editTitle,
                width      : '1000',
                buttons    : buttons
            });

            $curEl = self.$el;

            $curEl.find('#' + idToHide).hide();
            $curEl.find('#filesBlock').hide();
            self.formData = new FormData();

            $startDate = $curEl.find('#dateStart');
            $endDate = $curEl.find('#dateEnd');

            startDateObj = {
                changeMonth: true,
                changeYear : true,
                yearRange  : '-20y:c+10y',
                minDate    : new Date(dateStart),
                maxDate    : new Date(dateEnd),
                defaultDate: moment(jsonModel.dateStart, 'DD.MM.YYYY').toDate(),
                onClose    : function (selectedDate) {
                    $endDate.datepicker('option', 'minDate', selectedDate);
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

            if (!self.duplicate) {
                startDateObj.maxDate = new Date(dateEnd);
                endDateObj.minDate = new Date(dateStart);
            }

            $startDate.datepicker(startDateObj);
            $endDate.datepicker(endDateObj);

            implementShowHideArabicInputIn(self);


            self.renderLocations();

            self.contractTypes = CONSTANTS.CONTRACTS_TYPE;
            defaultType = _.findWhere(self.contractTypes, {_id: jsonModel.type._id});

            populate.inputDropDown({
                selector    : '#typeDd',
                context     : self,
                contentType : 'type',
                displayText : self.translation.type,
                displayModel: defaultType,
                collection  : self.contractTypes
            });

            $curEl.find('.objectivesTextarea').each(function (index, element) {
                var $element = $(element);

                $element.ckeditor({language: $element.attr('data-property')});
            });

            self.delegateEvents(self.events);

            return self;
        }
    });

    return CreateView;
});
