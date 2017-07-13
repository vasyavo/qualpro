var _ = require('underscore');
var topBarTemplate = require('../../../templates/planogram/topBarTemplate.html');
var pagination = require('../../../templates/pagination/pagination.html');
var baseTopBar = require('../../views/baseTopBar');
var manageView = require('../../views/planogram/manageView');
var CONTENT_TYPES = require('../../constants/contentType');
var ERROR_MESSAGES = require('../../constants/errorMessages');
var dataService = require('../../dataService');
var ManageProductsInformationView = require('../../views/planogram/manageProductsInformation');

module.exports = baseTopBar.extend({
    contentType       : CONTENT_TYPES.PLANOGRAM,
    template          : _.template(topBarTemplate),
    paginationTemplate: _.template(pagination),

    events: {
        'click #manageBtn': 'showManageDialog',
        'click #manage-block': 'toggleManageBlock',
        'click #namage-products': 'showManageProductsView'
    },

    toggleManageBlock: function () {
        this.$el.find('#manage-dropdown').toggleClass('showActionsDropDown');
    },

    showManageProductsView: function () {
        var that = this;

        dataService.getData('/category', {}, function (err, response) {
            if (err) {
                return App.renderErrors([
                    ERROR_MESSAGES.somethingWentWrong[App.currentUser.currentLanguage]
                ]);
            }

            that.manageProductInfoView = new ManageProductsInformationView({
                translation: that.translation,
                categories: response
            });
            that.manageProductInfoView.on('update-list-view', function () {
                that.trigger('update-list-view');
            });
        });

        this.$el.find('#manage-dropdown').removeClass('showActionsDropDown');
    },

    showManageDialog: _.debounce(function () {
        new manageView({
            translation: this.translation
        });

        this.$el.find('#manage-dropdown').removeClass('showActionsDropDown');
    }, 1000, true)
});
