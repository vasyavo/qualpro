define([
    'underscore',
    'jQuery',
    'constants/contentType',
    'constants/otherConstants',
    'common',
    'text!templates/planogram/create.html',
    'models/planogram',
    'views/baseDialog',
    'views/filter/dropDownView',
    'collections/planogram/collection',
    'collections/country/collection',
    'collections/retailSegment/collection',
    'collections/itemsPrices/collection',
    'collections/configurations/collection',
    'collections/filter/filterCollection',
    'dataService',
    'constants/contentType',
    'constants/errorMessages'
], function (_, $, CONSTANTS, OTHER_CONSTANTS, common, CreateTemplate, Model, BaseView, DropDownView, PlanogramCollection,
             CountryCollection, RetailSegmentCollection, ItemsPricesCollection, ConfigurationsCollection, filterCollection,
             dataService, CONTENT_TYPES, ERROR_MESSAGES) {

    var manageView = BaseView.extend({
        contentType: CONSTANTS.PLANOGRAM,
        files      : {},
        template   : _.template(CreateTemplate),
        attachCount: 0,

        events: {
            'change #inputImg' : 'fileSelected',
            'change .createOwn': 'setOwnValue'
        },

        initialize: function (options) {
            var comparator = function (model) {
                var name = model.get('name') && model.get('name').currentLanguage || model.get('name') || '';

                return name.toUpperCase();
            };

            this.translation = options.translation;
            this.model = new Model();

            this.countryCollection = new CountryCollection({count: -1, forDd: true});
            this.retailSegmentCollection = new RetailSegmentCollection({create: false});
            this.itemsPricesCollection = new ItemsPricesCollection({create: false});
            this.configurationsCollection = new ConfigurationsCollection();

            this.countryCollection.comparator = comparator;
            this.retailSegmentCollection.comparator = comparator;
            this.itemsPricesCollection.comparator = comparator;
            this.configurationsCollection.comparator = comparator;

            this.makeRender();
            this.render();
        },

        setOwnValue : function (e){
            var $target = $(e.target);
            var type = $target.attr('data-property');
            var value = $target.val();

            e.preventDefault();
            e.stopPropagation();

            if (type === 'displayType' && value) {
                this.selectedDisplayType = {
                    name : {
                        ar: value,
                        en: value
                    }};
                this.displayTypeDropDownView.selectedValues = [this.selectedDisplayType.name];
            }
        },

        fileSelected: function (e) {
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

                ++self.attachCount;
                self.$el.find('#img').attr('src', result);
                App.masonryGrid.call(self.$el);
            };

        },

        addPlanogram: function () {
            var self = this;
            this.body = {
                country      : this.selectedCountryId,
                retailSegment: this.selectedRetailSegmentId,
                product      : this.selectedProductId,
                configuration: this.selectedConfigurationId,
                displayType  : this.selectedDisplayType
            };
            this.body.photo = this.attachCount;

            this.model.setFieldsNames(this.translation);

            this.model.validate(this.body, function (err) {
                if (err && err.length) {
                    App.renderErrors(err);
                } else {
                    delete self.body.photo;
                    self.$el.find('#createPlanogramForm').submit();
                }
            });
        },

        submitForm: function (e) {
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
                    context.$el.dialog('close').dialog('destroy').remove();
                    context.trigger('modelSaved', model);
                }
            });
        },

        selectItem: function (data) {
            var itemName = data.contentType;
            var itemId = (data.model) ? data.model._id : null;
            var input = data.$selector;

            if (itemName === 'country') {

                this.selectedCountryId = itemId;

                this.$el.find('#retailSegmentSelect input').val('');
                this.$el.find('#productSelect input').val('');
                this.$el.find('#configurationSelect input').val('');

                this.itemsPricesCollection.reset();
                this.configurationsCollection.reset();

                this.retailSegmentCollection.fetch({
                    data: {
                        countryId: itemId,
                        count    : -1
                    },

                    reset: true
                });

            } else if (itemName === 'retailSegment') {

                const arrayOfSelectedRetailSegmentsId = data.selectedValuesIds || [];

                this.selectedRetailSegmentId = arrayOfSelectedRetailSegmentsId;

                this.$el.find('#productSelect input').val('');
                this.$el.find('#configurationSelect input').val('');

                this.itemsPricesCollection.fetch({
                    data: {
                        countryId    : this.selectedCountryId,
                        retailSegment: arrayOfSelectedRetailSegmentsId,
                        forDd        : true,
                        multi        : true
                    },

                    reset: true
                });

                this.configurationsCollection.fetchFromRetailSegmentId(arrayOfSelectedRetailSegmentsId);

            } else if (itemName === 'product') {
                this.selectedProductId = itemId;
            } else if (itemName === 'configuration') {
                this.selectedConfigurationId = itemId;
            } else if (itemName === 'displayType') {
                if (itemId === 'otherId'){
                    input.addClass('createOwn');
                    this.displayTypeDropDownView.selectedValues = [];
                    input.focus();
                } else {
                    this.selectedDisplayType = {
                        _id : itemId,
                        name : {
                            en : _.find(OTHER_CONSTANTS.DISPLAY_TYPE_DD.en, {_id : itemId}).name,
                            ar : _.find(OTHER_CONSTANTS.DISPLAY_TYPE_DD.ar, {_id : itemId}).name
                        }
                    };
                }
            }
        },

        render: function () {
            var $formString = $(this.template({
                translation: this.translation
            }));
            var self = this;

            this.countryDropDownView = new DropDownView({
                translation : this.translation,
                dropDownList: this.countryCollection,
                displayText : this.translation.country,
                contentType : CONTENT_TYPES.COUNTRY
            });

            this.displayTypeCollection = new filterCollection();

            this.displayTypeDropDownView = new DropDownView({
                translation : this.translation,
                dropDownList: this.displayTypeCollection,
                displayText : this.translation.displayType,
                contentType : CONTENT_TYPES.DISPLAYTYPE
            });

            this.displayTypeCollection.reset(OTHER_CONSTANTS.DISPLAY_TYPE_DD[App.currentUser.currentLanguage]);

            this.countryDropDownView.on('changeItem', this.selectItem, this);
            $formString.find('#countrySelect').append(this.countryDropDownView.el);

            this.displayTypeDropDownView.on('changeItem', this.selectItem, this);
            $formString.find('#displayTypeSelect').append(this.displayTypeDropDownView.el);

            this.retailSegmentDropDownView = new DropDownView({
                translation : this.translation,
                dropDownList: this.retailSegmentCollection,
                displayText : this.translation.retailSegment,
                contentType : CONTENT_TYPES.RETAILSEGMENT,
                multiSelect : true,
                noSingleSelectEvent : true,
                noAutoSelectOne : true
            });

            this.retailSegmentDropDownView.on('changeItem', this.selectItem, this);
            $formString.find('#retailSegmentSelect').append(this.retailSegmentDropDownView.el);

            this.productDropDownView = new DropDownView({
                translation : this.translation,
                dropDownList: this.itemsPricesCollection,
                displayText : this.translation.product,
                contentType : CONTENT_TYPES.PRODUCT
            });

            this.productDropDownView.on('changeItem', this.selectItem, this);
            $formString.find('#productSelect').append(this.productDropDownView.el);

            this.configurationDropDownView = new DropDownView({
                translation : this.translation,
                dropDownList: this.configurationsCollection,
                displayText : this.translation.configuration,
                contentType : CONTENT_TYPES.CONFIGURATIONS
            });

            this.configurationDropDownView.on('changeItem', this.selectItem, this);
            $formString.find('#configurationSelect').append(this.configurationDropDownView.el);

            this.$el = $formString.dialog({
                width      : 'auto',
                height     : 'auto',
                dialogClass: 'create-dialog',
                title      : this.translation.createPlanogram,
                buttons    : {
                    save  : {
                        text : this.translation.saveBtn,
                        click: function () {
                            self.addPlanogram();
                        }
                    },
                    cancel: {
                        text: this.translation.cancelBtn
                    }
                }
            });

            this.$el.find('#createPlanogramForm').on('submit', {body: this.body, context: this}, this.submitForm);


            this.delegateEvents(this.events);

            return this;
        }
    });

    return manageView;
});
