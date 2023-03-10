var $ = require('jquery');
var moment = require('moment');
var Backbone = require('backbone');
var Populate = require('../../populate');
var DisplayTypeCollection = require('../../collections/displayType/collection');
var CategoryCollection = require('../../collections/category/collection');
var BrandCollection = require('../../collections/brand/collection');
var OriginCollection = require('../../collections/origin/collection');
var ERROR_MESSAGES = require('../../constants/errorMessages');
var Template = require('../../../templates/competitorPromotion/edit.html');
var App = require('../../appState');

module.exports = Backbone.View.extend({

    initialize: function (options) {
        this.translation = options.translation;
        this.editableModel = options.editableModel;

        this.render();
        this.defineUiElements();
    },

    defineUiElements : function () {
        var view = this.$el;
        this.ui = {
            price: view.find('#price'),
            weight: view.find('#weight'),
            expiry: view.find('#date-expiry'),
            dateStart: view.find('#date-start'),
            dateEnd: view.find('#date-end'),
            description: view.find('#description'),
        };
    },

    template: _.template(Template),

    render: function () {
        var that = this;
        var currentLanguage = App.currentUser.currentLanguage;
        var model = this.editableModel;
        var dateStart = moment(model.dateStart, 'DD.MM.YYYY');
        var dateEnd = moment(model.dateEnd, 'DD.MM.YYYY');

        var layout = this.template({
            translation: this.translation,
            model: model,
        });

        this.$el = $(layout).dialog({
            width : 'auto',
            dialogClass : 'create-dialog',
            buttons : {
                save : {
                    text : that.translation.saveBtn,
                    click : function () {
                        var ui = that.ui;
                        var valid = true;
                        var startDate = that.$el.find('#dateStart').val();
                        var endDate = that.$el.find('#dateEnd').val();
                        var expiryDate = that.$el.find('#dateExpiry').val();
                        var data = {
                            price: ui.price.val(),
                            packing: ui.weight.val(),
                            expiry: expiryDate ? moment.utc(expiryDate, 'DD.MM.YYYY').endOf('day').toDate() : '',
                            dateStart: startDate ? moment.utc(startDate, 'DD.MM.YYYY').startOf('day').toDate() : '',
                            dateEnd: endDate ? moment.utc(endDate, 'DD.MM.YYYY').endOf('day').toDate() : '',
                            displayType: that.$el.find('#displayTypeDd').attr('data-id').split(','),
                            category: that.$el.find('#categoryDd').attr('data-id').split(','),
                            brand: that.$el.find('#brandDd').attr('data-id'),
                            origin: that.$el.find('#originDd').attr('data-id').split(','),
                            promotion: ui.description.val(),
                        };

                        if (data.displayType) {
                            data.displayType = data.displayType.filter(function (item) {
                                return item;
                            });
                        }

                        if (data.category) {
                            data.category = data.category.filter(function (item) {
                                return item;
                            });
                        }

                        if (data.origin) {
                            data.origin = data.origin.filter(function (item) {
                                return item;
                            });
                        }

                        if (!data.price) {
                            App.renderErrors([
                                ERROR_MESSAGES.rspRequired[currentLanguage]
                            ]);
                            valid = false;
                        }

                        if (isNaN(Number(data.price))) {
                            App.renderErrors([
                                ERROR_MESSAGES.rspIsNotANumber[currentLanguage]
                            ]);
                            valid = false;
                        }

                        if (!data.packing) {
                            App.renderErrors([
                                ERROR_MESSAGES.weightRequired[currentLanguage]
                            ]);
                            valid = false;
                        }

                        if (isNaN(Number(data.packing))) {
                            App.renderErrors([
                                ERROR_MESSAGES.weightIsNotANumber[currentLanguage]
                            ]);
                            valid = false;
                        }

                        if (!data.displayType.length) {
                            App.renderErrors([
                                ERROR_MESSAGES.displayTypeRequired[currentLanguage]
                            ]);
                            valid = false;
                        }

                        if (!data.promotion) {
                            App.renderErrors([
                                ERROR_MESSAGES.enterDescription[currentLanguage]
                            ]);
                            valid = false;
                        }

                        if (!data.category.length) {
                            App.renderErrors([
                                ERROR_MESSAGES.categoryRequired[currentLanguage]
                            ]);
                            valid = false;
                        }

                        if (!data.brand) {
                            App.renderErrors([
                                ERROR_MESSAGES.brandRequired[currentLanguage]
                            ]);
                            valid = false;
                        }

                        if (!data.origin.length) {
                            App.renderErrors([
                                ERROR_MESSAGES.originRequired[currentLanguage]
                            ]);
                            valid = false;
                        }

                        if (valid) {
                            that.trigger('edit-competitor-promotion-item', data, model._id);
                        }
                    }
                }
            }
        });

        var $startDate = that.$el.find('#dateStart');
        var $dueDate = that.$el.find('#dateEnd');
        var $expiryDate = that.$el.find('#dateExpiry');

        var startDateObj = {
            changeMonth: true,
            changeYear : true,
            maxDate : new Date(dateEnd),
            yearRange  : '-20y:c+10y',
            defaultDate: new Date(dateStart),
            onClose    : function (selectedDate) {
                $dueDate.datepicker('option', 'minDate', selectedDate);
            }
        };

        var endDateObj = {
            changeMonth: true,
            changeYear : true,
            minDate : new Date(dateStart),
            yearRange  : '-20y:c+10y',
            defaultDate: new Date(dateEnd),
            onClose    : function (selectedDate) {
                $startDate.datepicker('option', 'maxDate', selectedDate);
            }
        };

        var expiryDateObj = {
            changeMonth: true,
            changeYear : true,
            yearRange  : '-20y:c+10y',
            defaultDate: new Date(dateEnd),
        };

        $startDate.datepicker(startDateObj);
        $dueDate.datepicker(endDateObj);
        $expiryDate.datepicker(expiryDateObj);

        this.displayTypeCollection = new DisplayTypeCollection();
        this.displayTypeCollection.on('reset', function () {
            const defaultDisplayTypes = model.displayType.map(function (item) {
                return that.displayTypeCollection.findWhere({_id : item._id}).toJSON();
            });

            Populate.inputDropDown({
                selector    : '#displayTypeDd',
                context     : that,
                contentType : 'displayType',
                displayText : 'display type',
                displayModel: defaultDisplayTypes,
                collection  : that.displayTypeCollection.toJSON(),
                multiSelect: true,
                forPosition : true
            });
        }, this);

        this.categoryCollection = new CategoryCollection();
        this.categoryCollection.on('reset', function () {
            const defaultCategories = model.category.map(function (item) {
                return that.categoryCollection.findWhere({_id : item._id}).toJSON();
            });

            Populate.inputDropDown({
                selector    : '#categoryDd',
                context     : that,
                contentType : 'category',
                displayText : 'category',
                displayModel: defaultCategories,
                collection  : that.categoryCollection.toJSON(),
                forPosition : true
            });
        }, this);

        this.brandCollection = new BrandCollection({
            count: 250,
            fetch: true,
        });
        this.brandCollection.on('reset', function () {
            var brandModel = that.brandCollection.findWhere({_id : model.brand._id});
            var defaultBrands = brandModel ? [brandModel.toJSON()] : [];

            Populate.inputDropDown({
                selector    : '#brandDd',
                context     : that,
                contentType : 'brand',
                displayText : 'brand',
                displayModel: defaultBrands,
                collection  : that.brandCollection.toJSON(),
                forPosition : true
            });
        }, this);

        this.originCollection = new OriginCollection({
            count: 250,
        });
        this.originCollection.on('reset', function () {
            const defaultOrigins = model.origin.map(function (item) {
                return that.originCollection.findWhere({_id : item._id}).toJSON();
            });

            Populate.inputDropDown({
                selector    : '#originDd',
                context     : that,
                contentType : 'origin',
                displayText : 'origin',
                displayModel: defaultOrigins,
                collection  : that.originCollection.toJSON(),
                forPosition : true
            });
        }, this);
    }

});
