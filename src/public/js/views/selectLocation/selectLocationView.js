var $ = require('jQuery');
var _ = require('underscore');
var Dialog = require('../../views/baseDialog');
var dropDownView = require('../../views/filter/dropDownView');
var template = require('../../../templates/selectLocation/selectLocationTemplate.html');
var CountryCollection = require('../../collections/country/collection');
var RetailSegmentCollection = require('../../collections/retailSegment/collection');
var OutletCollection = require('../../collections/outlet/collection');
var dataService = require('../../dataService');
var validation = require('../../validation');
var App = require('../../appState');

module.exports = Dialog.extend({
    template  : _.template(template),
    viewsArray: ['country', 'retailSegment', 'outlet'],
    filter    : {
        country: {
            names : [],
            values: [],
            type  : 'ObjectId'
        },

        retailSegment: {
            names : [],
            values: [],
            type  : 'ObjectId'
        },

        outlet: {
            names : [],
            values: [],
            type  : 'ObjectId'
        }
    },

    initialize: function (options) {
        var self = this;

        dataService.getData('/filters/items/toOutlet', {}, function (err, result) {
            if (err) {
                App.render({type: 'error', message: err.responseText});
            }
            result.fetch = false;
            self.translation = options.translation;
            self.countryCollection = new CountryCollection(result, {parse: true});
            self.retailSegmentCollection = new RetailSegmentCollection({create: false});
            self.outletCollection = new OutletCollection({create: false});

            self.render();

            if (result.length) {
                self.countryCollection.trigger('reset');
            }
        });

        _.bindAll(this, 'render');
    },

    selectItem: function (data) {
        var $el = data.$item;
        var $itemSelect = $el.closest('.itemSelect');
        var itemName = $itemSelect.attr('data-content');
        var itemId = data.model._id;
        var $currentElement = this.$el.find('#countrySelect').find('#Dd');
        var oldCountryId;
        var oldRetailSegmentId;
        var countryId;
        var self = this;

        this.filter[itemName].names[0] = $el.text();
        this.filter[itemName].values[0] = itemId;

        if (itemName === 'country') {
            oldCountryId = $currentElement.attr('data-id');
            if (itemId !== oldCountryId || $currentElement.attr('data-auto')) {
                dataService.getData('/branch/location', {countryId: itemId}, function (err, res) {
                    if (err) {
                        App.render({type: 'error', message: err.responseText});
                    }

                    self.retailSegmentCollection.reset(res.retailSegment, {parse: true});
                    self.outletCollection.reset(res.outlet, {parse: true});

                    self.$el.find('#retailSegmentSelect').parent().show();
                    self.$el.find('#retailSegmentSelect').append(self.retailSegmentDropDownView.el);
                    self.$el.find('#outletSelect').parent().hide();
                });
            }
        } else if (itemName === 'retailSegment') {
            oldRetailSegmentId = this.$el.find('#countrySelect').find('#Dd').attr('data-id');
            if (itemId !== oldRetailSegmentId) {
                countryId = self.$el.find('#countrySelect').find('#Dd').attr('data-id');
                dataService.getData('/branch/location', {
                    retailSegmentId: itemId,
                    countryId      : countryId
                }, function (err, res) {
                    self.$el.find('#outletSelect').parent().show();
                    self.$el.find('#outletSelect').append(self.outletDropDownView.el);
                    self.outletCollection.reset(res.outlet, {parse: true});
                });
            }
        }
    },

    clickOkBtn: function (callback) {
        var self = this;
        var $el = this.$el;
        var errors = [];

        $el.find('.itemSelect').find('.dropDownInput>input')
            .each(function () {
                var $item = $(this);
                var itemName = $item.closest('.row').find('.required').text();

                validation.checkForValuePresence(errors, true, $item.val(), itemName);
            });

        if (errors.length) {
            return App.renderErrors(errors);
        }

        this.trigger('locationSelected', self.filter);
        callback();
    },

    render: function () {
        var $formString = $(this.template({
            translation: this.translation
        }));
        var self = this;

        this.viewsArray.forEach(function (viewName) {
            self[viewName + 'DropDownView'] = new dropDownView({
                dropDownList: self[viewName + 'Collection']
            });

            self[viewName + 'DropDownView'].on('changeItem', self.selectItem, self);
        });

        $formString.find('#countrySelect').append(self.countryDropDownView.el);
        $formString.find('#countrySelect').parent().nextAll().hide();

        this.$el = $formString.dialog({
            dialogClass: 'create-dialog',
            width      : '455px',
            buttons    : {
                save: {
                    text : self.translation.okBtn,
                    class: 'btn createBtn',
                    click: function () {
                        var dialog = this;

                        self.clickOkBtn(function () {
                            $(dialog).dialog('close').dialog('destroy').remove();
                        });
                    }
                },

                cancel: {
                    text: self.translation.cancelBtn
                }
            }
        });
    }
});
