var $ = require('jQuery');
var _ = require('underscore');
var PreviewTemplate = require('../../../templates/priceSurvey/preview.html');
var PreviewBodyTemplate = require('../../../templates/priceSurvey/previewBody.html');
var BrandCollection = require('../../collections/priceSurvey/brandCollection');
var BaseView = require('../../views/baseDialog');
var CONTENT_TYPES = require('../../constants/contentType');
var dataService = require('../../dataService');
var EditPriceSurveyValueView = require('../../views/priceSurvey/editPriceSurveyValue');
var PriceSurveyBrandModel = require('../../models/priceSurveyBrand');
var INFO_MESSAGES = require('../../constants/infoMessages');
var ACL_ROLES = require('../../constants/aclRoleIndexes');
var App = require('../../appState');

module.exports = BaseView.extend({
    contentType: CONTENT_TYPES.PRICESURVEY,

    template           : _.template(PreviewTemplate),
    previewBodyTemplate: _.template(PreviewBodyTemplate),

    events: {
        'click #edit' : 'handleEditClick',
        'click #delete' : 'handleDeleteClick',
    },

    initialize: function (options) {
        var self = this;
        this.translation = options.translation;

        options.contentType = this.contentType;

        this.category = options.category;
        this.brand = options.brand;
        this.variant = options.variant;
        this.size = options.size;
        this.branch = options.branch;

        this.collection = new BrandCollection(options.models, {parse: true});
        this.makeRender(options);
        this.render();

        this.brandSearchEvent = _.debounce(function (e) {
            var $el = $(e.target);
            var value = $el.val();

            self.brandSearch(value);
        }, 500);

        this.$el.find('#brandSearch').on('input', this.brandSearchEvent);
    },

    handleEditClick: function (event) {
        var that = this;
        var target = $(event.target);
        var currentValue = target.attr('data-value');

        this.editablePriceSurveyId = target.attr('data-id');
        this.editablePriceSurveyItemId = target.attr('data-item-id');

        this.editValueView = new EditPriceSurveyValueView({
            translation: this.translation,
            initialValue: currentValue,
        });

        this.editValueView.on('new-price-submitted', function (newPrice) {
            var model = new PriceSurveyBrandModel();

            model.editValueOfPriceSurveyItem({
                price: newPrice,
                priceSurveyId: that.editablePriceSurveyId,
                priceSurveyItemId: that.editablePriceSurveyItemId,
            });

            model.on('price-survey-value-edited', function () {
                that.$el.find('#' + that.editablePriceSurveyId).html('' + newPrice);
                target.attr('data-value', newPrice);
                that.trigger('update-list-view');
            });
        });
    },

    handleDeleteClick: function (event) {
        if (confirm(INFO_MESSAGES.confirmDeletePriceSurveyItem[App.currentUser.currentLanguage])) {
            var that = this;
            var target = $(event.target);
            var model = new PriceSurveyBrandModel();

            var priceSurveyIdToDelete = target.attr('data-id');
            var priceSurveyItemIdToDelete = target.attr('data-item-id');

            model.deleteItem(priceSurveyIdToDelete, priceSurveyItemIdToDelete);

            model.on('price-survey-item-deleted', function () {
                that.$el.dialog('close').dialog('destroy').remove();

                that.trigger('update-list-view');
            });
        }
    },

    brandSearch: function (value) {
        var self = this;

        dataService.getData('/' + this.contentType + '/brands', {
            category: this.category,
            brand   : this.brand,
            variant : this.variant,
            size    : this.size,
            branch  : this.branch,
            search  : value
        }, function (err, res) {
            if (err) {
                return App.render(err);
            }

            self.collection = new BrandCollection(res, {parse: true});
            self.showMoreContent(self.collection.toJSON());
        });
    },

    showMoreContent: function (newModels) {
        var $mainContent = this.$el.find('#mainContent');

        $mainContent.empty();
        $mainContent.html(this.previewBodyTemplate({
            collection : newModels,
            translation: this.translation
        }));
    },

    render: function () {
        var jsonCollection = this.collection.toJSON();
        var permittedToManage = [ACL_ROLES.MASTER_ADMIN, ACL_ROLES.COUNTRY_ADMIN, ACL_ROLES.MASTER_UPLOADER, ACL_ROLES.COUNTRY_UPLOADER].includes(App.currentUser.accessRole.level);
        var optionsCol = '<th>' + this.translation.options + '</th>';
        var formString = this.template({
            translation: this.translation,
            permittedToManage: permittedToManage,
            optionsCol: optionsCol
        });

        this.$el = $(formString).dialog({
            dialogClass  : 'self-share-dialog',
            title        : '',
            showCancelBtn: false,
            buttons      : {
                ok: {
                    text : 'OK',
                    class: 'btn',
                    click: function () {
                        $(this).dialog('close').dialog('destroy').remove();
                    }
                }
            }
        });

        this.$el.find('#mainContent').html(this.previewBodyTemplate({
            collection : jsonCollection,
            translation: this.translation,
            permittedToManage: permittedToManage
        }));

        this.delegateEvents(this.events);

        return this;
    }
});
