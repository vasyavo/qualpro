define([
    'Backbone',
    'jQuery',
    'Underscore',
    'constants/contentType',
    'text!templates/notifications/create.html',
    'views/baseDialog',
    'views/filter/dropDownView',
    'models/country',
    'models/region',
    'models/subRegion',
    'models/retailSegment',
    'models/outlet',
    'models/branch',
    'models/parrent',
    'models/personnel',
    'models/notifications',
    'populate',
    'collections/notifications/collection',
    'helpers/implementShowHideArabicInputIn',
    'constants/otherConstants',
    'moment',
    'dataService'
], function (Backbone, $, _, CONTENT_TYPES, CreateTemplate, BaseView, DropDownView, CountryModel, RegionModel,
             SubRegionModel, RetailSegmentModel, OutletModel, BranchModel, ParentModel, PersonnelModel, Model, populate,
             notificationsCollection, implementShowHideArabicInputIn, CONSTANTS, moment, dataService) {
    'use strict';

    var CreateView = BaseView.extend({
        contentType: CONTENT_TYPES.NOTIFICATIONS,

        template: _.template(CreateTemplate),
        imageSrc: '',

        initialize: function (options) {
            this.translation = options.translation;
            this.model = new Model();
            this.locationFilter = {};

            this.makeRender();
            this.render();
        },

        sendNotification: function (cb) {
            var self = this;
            var $curEl = this.$el;

            var recipientsCountry = $curEl.find('#countryDd').attr('data-id');

            var recipientsRegion = $curEl.find('#regionDd').attr('data-id') ||
                _.pluck(this.regionDropDown.collection.toJSON(), '_id').join();
            var recipientsSubRegion = $curEl.find('#subRegionDd').attr('data-id') ||
                _.pluck(this.subRegionDropDown.collection.toJSON(), '_id').join();
            var recipientsRetailSegment = $curEl.find('#retailSegmentDd').attr('data-id') ||
                _.pluck(this.retailSegmentDropDown.collection.toJSON(), '_id').join();
            var recipientsOutlet = $curEl.find('#outletDd').attr('data-id') ||
                _.pluck(this.outletDropDown.collection.toJSON(), '_id').join();
            var recipientsBranch = $curEl.find('#branchDd').attr('data-id') ||
                _.pluck(this.branchDropDown.collection.toJSON(), '_id').join();
            var recipientsPosition = $curEl.find('#positionDd').attr('data-id') ||
                _.pluck(this.positionDropDown.collection.toJSON(), '_id').join();
            var recipients = $curEl.find('#personnelDd').attr('data-id') ||
                _.pluck(this.personnelDropDown.collection.toJSON(), '_id').join();

            var notification = {
                country      : recipientsCountry,
                region       : recipientsRegion,
                subRegion    : recipientsSubRegion,
                retailSegment: recipientsRetailSegment,
                outlet       : recipientsOutlet,
                branch       : recipientsBranch,
                position     : recipientsPosition,
                recipients   : recipients,
                description  : {
                    en: $curEl.find('.objectivesTextarea[data-property="en"]').val(),
                    ar: $curEl.find('.objectivesTextarea[data-property="ar"]').val()
                }
            };

            this.model.setFieldsNames(this.translation);

            this.model.save(notification, {
                wait   : true,
                success: function (data) {
                    self.trigger('modelSaved', data);
                    cb();
                },
                error  : function (model, xhr) {
                    App.render({type: 'error', message: xhr.responseText});
                }
            });
        },

        renderLocations: function () {
            var self = this;

            dataService.getData('/filters/notificationCreate', {query: self.locationFilter}, function (err, result) {
                if (err) {
                    return App.render(err);
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
                self.positionCollection = new Backbone.Collection(result.position, {
                    model: ParentModel,
                    parse: true
                });
                self.personnelCollection = new Backbone.Collection(result.personnel, {
                    model: PersonnelModel,
                    parse: true
                });

                self.countryDropDown = new DropDownView({
                    dropDownList       : self.countryCollection,
                    displayText        : self.translation.inputCountryName,
                    contentType        : CONTENT_TYPES.COUNTRY,
                    multiSelect        : true,
                    noSingleSelectEvent: true,
                    noAutoSelectOne    : true
                });
                self.$el.find('#countryDd').replaceWith(self.countryDropDown.el);

                self.regionDropDown = new DropDownView({
                    dropDownList       : self.regionCollection,
                    displayText        : self.translation.inputRegionName,
                    contentType        : CONTENT_TYPES.REGION,
                    multiSelect        : true,
                    noSingleSelectEvent: true,
                    noAutoSelectOne    : true
                });
                self.$el.find('#regionDd').replaceWith(self.regionDropDown.el);

                self.subRegionDropDown = new DropDownView({
                    dropDownList       : self.subRegionCollection,
                    displayText        : self.translation.inputSubRegionName,
                    contentType        : CONTENT_TYPES.SUBREGION,
                    multiSelect        : true,
                    noSingleSelectEvent: true,
                    noAutoSelectOne    : true
                });
                self.$el.find('#subRegionDd').replaceWith(self.subRegionDropDown.el);

                self.retailSegmentDropDown = new DropDownView({
                    dropDownList       : self.retailSegmentCollection,
                    displayText        : self.translation.inputTradeChannelName,
                    contentType        : CONTENT_TYPES.RETAILSEGMENT,
                    multiSelect        : true,
                    noSingleSelectEvent: true,
                    noAutoSelectOne    : true
                });
                self.$el.find('#retailSegmentDd').replaceWith(self.retailSegmentDropDown.el);

                self.outletDropDown = new DropDownView({
                    dropDownList       : self.outletCollection,
                    displayText        : self.translation.inputOutletName,
                    contentType        : CONTENT_TYPES.OUTLET,
                    multiSelect        : true,
                    noSingleSelectEvent: true,
                    noAutoSelectOne    : true
                });
                self.$el.find('#outletDd').replaceWith(self.outletDropDown.el);

                self.branchDropDown = new DropDownView({
                    dropDownList       : self.branchCollection,
                    displayText        : self.translation.inputBranchName,
                    contentType        : CONTENT_TYPES.BRANCH,
                    multiSelect        : true,
                    noSingleSelectEvent: true,
                    noAutoSelectOne    : true
                });
                self.$el.find('#branchDd').replaceWith(self.branchDropDown.el);

                self.positionDropDown = new DropDownView({
                    dropDownList       : self.positionCollection,
                    displayText        : self.translation.inputPositionName,
                    contentType        : CONTENT_TYPES.POSITION,
                    multiSelect        : true,
                    noSingleSelectEvent: true,
                    noAutoSelectOne    : true
                });
                self.$el.find('#positionDd').replaceWith(self.positionDropDown.el);

                self.personnelDropDown = new DropDownView({
                    dropDownList       : self.personnelCollection,
                    displayText        : self.translation.inputEmployeeName,
                    contentType        : CONTENT_TYPES.PERSONNEL,
                    multiSelect        : true,
                    noSingleSelectEvent: true,
                    noAutoSelectOne    : true
                });

                self.$el.find('#personnelDd').replaceWith(self.personnelDropDown.el);


                self.countryDropDown.collection.reset(result.country, {parse: true});
                self.regionDropDown.collection.reset(result.region, {parse: true});
                self.subRegionDropDown.collection.reset(result.subRegion, {parse: true});
                self.retailSegmentDropDown.collection.reset(result.retailSegment, {parse: true});
                self.outletDropDown.collection.reset(result.outlet, {parse: true});
                self.branchDropDown.collection.reset(result.branch, {parse: true});
                self.positionDropDown.collection.reset(result.position, {parse: true});
                self.personnelDropDown.collection.reset(result.personnel, {parse: true});


                self.countryDropDown.on('changeItem', function (opts) {
                    var ids = opts.selectedValuesIds;

                    if (ids.length) {
                        self.locationFilter.country = {type: 'ObjectId', values: ids};
                    } else {
                        delete self.locationFilter.country;
                    }
                    self.resetLocations({country: true});
                }, self);

                self.regionDropDown.on('changeItem', function (opts) {
                    var ids = opts.selectedValuesIds;

                    if (ids.length) {
                        self.locationFilter.region = {type: 'ObjectId', values: ids};
                    } else {
                        delete self.locationFilter.region;
                    }
                    self.resetLocations({
                        country: true,
                        region : true
                    });
                }, this);

                self.subRegionDropDown.on('changeItem', function (opts) {
                    var ids = opts.selectedValuesIds;

                    if (ids.length) {
                        self.locationFilter.subRegion = {type: 'ObjectId', values: ids};
                    } else {
                        delete self.locationFilter.subRegion;
                    }
                    self.resetLocations({
                        country  : true,
                        region   : true,
                        subRegion: true
                    });
                }, this);

                self.retailSegmentDropDown.on('changeItem', function (opts) {
                    var ids = opts.selectedValuesIds;

                    if (ids.length) {
                        self.locationFilter.retailSegment = {type: 'ObjectId', values: ids};
                    } else {
                        delete self.locationFilter.retailSegment;
                    }
                    self.resetLocations({
                        country      : true,
                        region       : true,
                        subRegion    : true,
                        retailSegment: true
                    });
                }, self);

                self.outletDropDown.on('changeItem', function (opts) {
                    var ids = opts.selectedValuesIds;

                    if (ids.length) {
                        self.locationFilter.outlet = {type: 'ObjectId', values: ids};
                    } else {
                        delete self.locationFilter.outlet;
                    }
                    self.resetLocations({
                        country      : true,
                        region       : true,
                        subRegion    : true,
                        retailSegment: true,
                        outlet       : true
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
                        country      : true,
                        region       : true,
                        subRegion    : true,
                        retailSegment: true,
                        outlet       : true,
                        branch       : true
                    });
                }, self);

                self.positionDropDown.on('changeItem', function (opts) {
                    var ids = opts.selectedValuesIds;

                    if (ids.length) {
                        self.locationFilter.position = {type: 'ObjectId', values: ids};
                    } else {
                        delete self.locationFilter.position;
                    }
                    self.resetLocations({
                        country      : true,
                        region       : true,
                        subRegion    : true,
                        retailSegment: true,
                        outlet       : true,
                        branch       : true,
                        position     : true
                    });
                }, self);
            });
        },

        resetLocations: function (options) {
            var self = this;

            dataService.getData('/filters/notificationCreate', {filter: self.locationFilter},
                function (err, result) {
                    if (err) {
                        return App.render(err);
                    }

                    if (!options.country) {
                        self.countryDropDown.collection.reset(result.country, {parse: true});
                    }
                    if (!options.region) {
                        self.regionDropDown.collection.reset(result.region, {parse: true});
                    }
                    if (!options.subRegion) {
                        self.subRegionDropDown.collection.reset(result.subRegion, {parse: true});
                    }
                    if (!options.retailSegment) {
                        self.retailSegmentDropDown.collection.reset(result.retailSegment, {parse: true});
                    }
                    if (!options.outlet) {
                        self.outletDropDown.collection.reset(result.outlet, {parse: true});
                    }
                    if (!options.branch) {
                        self.branchDropDown.collection.reset(result.branch, {parse: true});
                    }
                    if (!options.position) {
                        self.positionDropDown.collection.reset(result.position, {parse: true});
                    }
                    self.personnelDropDown.collection.reset(result.personnel, {parse: true});
                });
        },

        render: function () {
            var anotherLanguage = App.currentUser.currentLanguage === 'en' ? 'Ar' : 'En';
            var idToHide = 'description' + anotherLanguage + 'Container';
            var jsonModel = this.model.toJSON();
            var formString = this.template({jsonModel: jsonModel, translation: this.translation});
            var self = this;
            var $curEl;

            this.$el = $(formString).dialog({
                dialogClass: 'create-dialog full-height-dialog',
                title      : this.translation.newNotification,
                width      : '1000',
                buttons    : {
                    send  : {
                        text : this.translation.sendBtn,
                        class: 'btn sendBtn',
                        click: function () {
                            var that = this;

                            self.sendNotification(function () {
                                $(that).dialog('destroy').remove();
                            });
                        }
                    },
                    cancel: {
                        text: this.translation.cancelBtn
                    }
                }
            });

            $curEl = this.$el;

            $curEl.find('#' + idToHide).hide();

            implementShowHideArabicInputIn(this);

            this.renderLocations();

            this.$el.find('.objectivesTextarea').each(function (index, element) {
                var $element = $(element);

                $element.ckeditor({language: $element.attr('data-property')});
            });

            return this;
        }

    });

    return CreateView;
});
