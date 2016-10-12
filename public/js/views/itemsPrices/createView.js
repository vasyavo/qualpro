define([
    'Backbone',
    'jQuery',
    'Underscore',
    'async',
    'text!templates/itemsPrices/create/main.html',
    'views/nestedContent/view',
    'views/baseDialog',
    'views/filter/dropDownView',
    'collections/country/collection',
    'dataService'
], function (Backbone, $, _, async, CreateTemplate,
             NestedContentView, BaseView, DropDownView, CountryCollection, dataService) {

    var defaultTypes = {
        category: {
            index      : 0,
            editable   : true,
            templateDir: 'templates/itemsPrices/create/categoryAndVariant'
        },

        variant: {
            index      : 1,
            editable   : true,
            templateDir: 'templates/itemsPrices/create/categoryAndVariant'
        },

        item: {
            index      : 2,
            editable   : true,
            templateDir: 'templates/itemsPrices/create/item'
        }
    };
    var CreateView = BaseView.extend({
        contentType: 'itemsPrices',
        template   : _.template(CreateTemplate),

        initialize: function (options) {

            this.translation = options.translation;
            this.makeRender();
            this.render();
        },

        render: function () {
            var $formString = $(this.template({
                translation: this.translation
            }));
            var currentCountries;
            var self = this;

            this.$el = $formString.dialog({
                width      : '80%',
                height     : '80%',
                dialogClass: 'create-dialog',
                title      : this.translation.createItems,
                buttons    : {
                    cancel: {
                        text: self.translation.closeBtn
                    }
                }
            });

            this.nestedContent = new NestedContentView({
                el         : this.$el.find('#nestedContentHolder'),
                types      : defaultTypes,
                translation: this.translation
            });

            this.nestedContent.on('itemSaved', function (model) {
                self.trigger('itemSaved', model);
            });

            currentCountries = App.currentUser.country;

            if (currentCountries.length) {
                currentCountries.fetch = false;
            }

            this.countryCollection = new CountryCollection(currentCountries);
            this.countryDropDownView = new DropDownView({
                dropDownList: this.countryCollection,
                displayText : this.translation.country
            });

            this.$el.find('#countryDropDown').append(this.countryDropDownView.el);
            this.countryDropDownView.on('changeItem', function (data) {
                var model = data.model;

                self.nestedContent.selectedCountry = model._id;
            });

            this.$el.find('#countryDropDown').addClass('hidden');

            this.nestedContent.on('setCountry', function (countryId) {
                var ids = countryId ? [countryId] : [];

                self.countryDropDownView.trigger('setSelectedByIds', {ids: ids});
                self.nestedContent.selectedCountry = countryId;
            });

            if (currentCountries.length) {
                this.countryCollection.trigger('reset');
            }

            this.delegateEvents(this.events);

            return this;
        }
    });
    return CreateView;
});
