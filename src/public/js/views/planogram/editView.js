'use strict';

define([
    'jQuery',
    'constants/contentType',
    'constants/otherConstants',
    'collections/country/collection',
    'collections/retailSegment/collection',
    'collections/itemsPrices/collection',
    'collections/configurations/collection',
    'text!templates/planogram/edit.html',
    'views/baseDialog',
    'views/filter/dropDownView',
    'models/planogram',
    'common',
    'constants/contentType',
    'constants/errorMessages'
], function ($, CONSTANTS, OTHER_CONSTANTS, CountryCollection, RetailSegmentCollection, ItemsPricesCollection, ConfigurationsCollection,
             template, BaseView, dropDownView, planogramModel, common, CONTENT_TYPES, ERROR_MESSAGES) {

    var EditView = BaseView.extend({
        contentType             : CONSTANTS.PLANOGRAM,
        imageSrc                : '',
        template                : _.template(template),
        countryCollection       : null,
        retailSegmentCollection : null,
        itemsPricesCollection   : null,
        configurationsCollection: null,
        $errrorHandler          : null,
        imgChange               : null,
        bodyChange              : null,

        events: {
            'change #inputImg': 'changeImage'
        },

        initialize: function (options) {
            var countryId;
            let retailSegments;
            var modelJSON;

            _.bindAll(this, 'render');

            this.currentModel = options.model;
            this.translation = options.translation;

            modelJSON = this.currentModel.toJSON();
            countryId = modelJSON.country._id;
            retailSegments = modelJSON.retailSegment.map((item) => {
                return item._id;
            });

            this.responseObj = {};
            this.makeRender();

            this.countryCollection = new CountryCollection({count: -1, forDd: true});
            this.retailSegmentCollection = new RetailSegmentCollection({countryId: countryId});
            this.itemsPricesCollection = new ItemsPricesCollection({
                countryId    : countryId,
                retailSegment: retailSegments,
                forDd        : true,
                multi        : true
            });
            this.configurationsCollection = new ConfigurationsCollection({create: false});
            this.configurationsCollection.fetchFromRetailSegmentId(retailSegments);

            this.render();
        },

        changeImage: function (e) {
            var self = this;
            var reader = new FileReader();
            var currentLanguage = (App.currentUser && App.currentUser.currentLanguage) ? App.currentUser.currentLanguage : 'en';

            reader.readAsDataURL(e.target.files[0]);
            reader.onload = function (el) {
                var result = el.target.result;
                var type = result.split(',')[0].split(':')[1].split(';')[0];

                if (OTHER_CONSTANTS.IMAGE_CONTENT_TYPES.indexOf(type) === -1) {
                    App.render({type: 'error', message: ERROR_MESSAGES.forbiddenTypeOfFile[currentLanguage]});
                    return;
                }

                self.imgChange = true;
                self.$el.find('#imgPreView').attr('src', result);
            };
            App.masonryGrid.call(this.$el);
        },

        savePlanogram: function () {
            var self = this;
            var model = this.model.toJSON();
            this.body = {};

            if (this.selectedCountryId && this.selectedCountryId !== model.country._id) {
                this.body.country = this.selectedCountryId;
            }
            if (this.selectedRetailSegmentId && this.selectedRetailSegmentId !== model.retailSegment._id) {
                this.body.retailSegment = this.selectedRetailSegmentId;
            }
            if (this.selectedProductId && this.selectedProductId !== model.product._id) {
                this.body.product = this.selectedProductId;
            }
            if (this.selectedConfigurationId && this.selectedConfigurationId !== model.configuration._id) {
                this.body.configuration = this.selectedConfigurationId;
            }
            if (!Object.keys(this.body).length && !this.imgChange) {
                return this.$el.dialog('close').dialog('destroy').remove();
            }

            this.model.setFieldsNames(this.translation, this.body);

            this.model.validate(this.body, function (err) {
                if (err && err.length) {
                    App.renderErrors(err);
                } else {
                    self.$el.find('#editPlanogramForm').submit();
                }
            });
        },

        submitForm: function (e) {
            var context = e.data.context;
            var data = new FormData(this);
            e.preventDefault();
            data.append('data', JSON.stringify(context.body));
            $.ajax({
                url        : context.model.url(),
                type       : 'PATCH',
                data       : data,
                contentType: false,
                processData: false,
                success    : function (xhr) {
                    var model = new planogramModel(xhr, {parse: true});
                    context.$el.dialog('close').dialog('destroy').remove();
                    context.trigger('modelSaved', model);
                }
            });
        },

        render: function () {
            var modelJSON = this.model.toJSON();
            var $formString = $(this.template({
                translation: this.translation,
                model      : modelJSON
            }));
            var self = this;

            self.selectedCountryId = modelJSON.country && modelJSON.country._id || null;
            self.selectedRetailSegmentId = modelJSON.retailSegment && modelJSON.retailSegment || null;
            self.selectedProductId = modelJSON.product && modelJSON.product._id || null;
            self.selectedConfigurationId = modelJSON.configuration && modelJSON.configuration || null;

            this.countryDropDownView = new dropDownView({
                translation   : this.translation,
                dropDownList  : this.countryCollection,
                selectedValues: [modelJSON.country],
                displayText   : this.translation.country,
                contentType   : CONTENT_TYPES.COUNTRY
            });

            this.countryDropDownView.on('changeItem', function (data) {
                var model = data.model;
                var rateilSegmentModel;
                var productModel;
                var configurationModel;

                self.selectedCountryId = model._id;

                if (self.firstCountryLoad || self.countryCollection.length !== 1) {
                    self.retailSegmentDropDownView.removeSelected();
                    rateilSegmentModel = self.retailSegmentCollection.get(self.selectedRetailSegmentId);
                    if (rateilSegmentModel) {
                        rateilSegmentModel.set('selected', false);
                    }

                    self.productDropDownView.removeSelected();
                    productModel = self.itemsPricesCollection.get(self.selectedProductId);
                    if (productModel) {
                        productModel.set('selected', false);
                    }

                    self.configurationDropDownView.removeSelected();
                    configurationModel = self.configurationsCollection.get(self.selectedConfigurationId);
                    if (configurationModel) {
                        configurationModel.set('selected', false);
                    }

                    self.selectedRetailSegmentId = null;
                    self.selectedProductId = null;
                    self.selectedConfigurationId = null;

                    self.itemsPricesCollection.reset();
                    self.configurationsCollection.reset();

                    self.retailSegmentCollection.fetch({
                        data : {
                            countryId: self.selectedCountryId
                        },
                        reset: true
                    });
                }

                self.firstCountryLoad = true;
            });
            $formString.find('#countrySelect').append(this.countryDropDownView.el);

            this.retailSegmentDropDownView = new dropDownView({
                translation   : this.translation,
                dropDownList  : this.retailSegmentCollection,
                selectedValues: modelJSON.retailSegment,
                displayText   : this.translation.retailSegment,
                contentType   : CONTENT_TYPES.RETAILSEGMENT,
                multiSelect   : true,
                noSingleSelectEvent : true,
                noAutoSelectOne : true
            });

            this.retailSegmentDropDownView.on('changeItem', function (data) {
                var model = data.model;
                var productModel;
                var configurationModel;

                const arrayOfSelectedRetailSegmentsId = data.selectedValuesIds || [];

                self.selectedRetailSegmentId = arrayOfSelectedRetailSegmentsId;

                self.productDropDownView.removeSelected();
                productModel = self.itemsPricesCollection.get(self.selectedProductId);
                if (productModel) {
                    productModel.set('selected', false);
                }

                self.configurationDropDownView.removeSelected();
                configurationModel = self.configurationsCollection.get(self.selectedConfigurationId);
                if (configurationModel) {
                    configurationModel.set('selected', false);
                }

                self.selectedProductId = null;
                self.selectedConfigurationId = null;

                self.itemsPricesCollection.fetch({
                    data : {
                        countryId    : self.selectedCountryId,
                        retailSegment: self.selectedRetailSegmentId,
                        forDd        : true,
                        multi        : true
                    },
                    reset: true
                });

                self.configurationsCollection.fetchFromRetailSegmentId(arrayOfSelectedRetailSegmentsId);
            });
            $formString.find('#retailSegmentSelect').append(this.retailSegmentDropDownView.el);

            this.productDropDownView = new dropDownView({
                translation   : this.translation,
                dropDownList  : this.itemsPricesCollection,
                selectedValues: [modelJSON.product],
                displayText   : this.translation.product,
                contentType   : CONTENT_TYPES.PRODUCT
            });

            this.productDropDownView.on('changeItem', function (data) {
                var model = data.model;

                self.selectedProductId = model._id;
            });
            $formString.find('#productSelect').append(this.productDropDownView.el);

            this.configurationDropDownView = new dropDownView({
                translation   : this.translation,
                dropDownList  : this.configurationsCollection,
                selectedValues: [modelJSON.configuration],
                displayText   : this.translation.configuration,
                contentType   : CONTENT_TYPES.CONFIGURATIONS
            });

            this.configurationDropDownView.on('changeItem', function (data) {
                self.selectedConfigurationId = data.model;
            });
            $formString.find('#configurationSelect').append(this.configurationDropDownView.el);

            this.$el = $formString.dialog({
                dialogClass: 'edit-dialog',
                title      : this.translation.editPlanogram,
                buttons    : {
                    save  : {
                        text : this.translation.saveBtn,
                        class: 'btn',
                        click: function () {
                            self.savePlanogram();
                        }
                    },
                    cancel: {
                        text : this.translation.cancelBtn,
                        class: 'btn'
                    }
                }
            });

            this.$errrorHandler = $('#errorHandler');

            this.$el.find('#editPlanogramForm').on('submit', {body: this.body, context: this}, this.submitForm);

            this.delegateEvents(this.events);

            return this;
        }

    });

    return EditView;
});
