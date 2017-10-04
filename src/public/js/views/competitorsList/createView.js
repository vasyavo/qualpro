var $ = require('jquery');
var _ = require('underscore');
var CreateTemplate = require('../../../templates/competitorsList/create/main.html');
var BrandListView = require('../../views/competitorsList/brandListView');
var NestedContentView = require('../../views/nestedContent/view');
var BaseView = require('../../views/baseDialog');
var DropDownView = require('../../views/filter/dropDownView');
var CountryCollection = require('../../collections/country/collection');
var App = require('../../appState');

var types = {
    category: {
        index      : 0,
        editable   : false,
        templateDir: 'competitorsList.templates.create.category'
    },

    competitorVariant: {
        index      : 1,
        editable   : true,
        templateDir: 'itemsPrices.templates.create.categoryAndVariant'
    },

    competitorItem: {
        index      : 2,
        editable   : true,
        templateDir: 'competitorsList.templates.create.item'
    }
};

module.exports = BaseView.extend({
    contentType: 'competitorsList',

    template: _.template(CreateTemplate),

    events: {},

    initialize: function (options) {

        this.translation = options.translation;
        this.makeRender(options);
        this.render();
        this.brandListView.on('brandSelect', this.brandSelect, this);
    },

    brandSelect: function (brandId) {
        this.nestedContenView.brandId = brandId;
        this.nestedContenView.trigger('brandSelect');
    },

    render: function () {
        var $formString = $(this.template({
            translation: this.translation
        }));
        var self = this;
        var currentCountryes;

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

        this.brandListView = new BrandListView({
            el         : this.$el.find('#brandListHolder'),
            translation: this.translation
        });

        this.nestedContenView = new NestedContentView({
            el               : this.$el.find('#nestedContentHolder'),
            types            : types,
            notShowCategories: true,
            translation      : this.translation,
            checkCountryDD   : true
        });

        currentCountryes = App.currentUser.country;

        if (currentCountryes.length) {
            currentCountryes.fetch = false;
        }

        this.countryCollection = new CountryCollection(currentCountryes);
        this.countryDropDownView = new DropDownView({
            dropDownList: this.countryCollection,
            displayText : this.translation.country
        });

        this.$el.find('#countryDropDown').append(this.countryDropDownView.el);
        this.countryDropDownView.on('changeItem', function (data) {
            var model = data.model;

            self.nestedContenView.selectedCountry = model._id;
        });

        this.$el.find('#countryDropDown').addClass('hidden');

        this.nestedContenView.on('setCountry', function (countryId) {
            var ids = (countryId) ? [countryId] : [];

            self.countryDropDownView.trigger('setSelectedByIds', {ids: ids});
            self.nestedContenView.selectedCountry = countryId;
        });

        if (currentCountryes.length) {
            this.countryCollection.trigger('reset');
        }

        this.brandListView.on('blockTables', this.nestedContenView.blockTables, this.nestedContenView);

        this.nestedContenView.on('editInProgress', function (value) {
            this.brandListView.editInProgress = value;
        }, this);

        this.brandListView.on('editInProgress', function (value) {
            this.nestedContenView.editInProgress = value;
        }, this);

        this.delegateEvents(this.events);

        return this;
    }
});
