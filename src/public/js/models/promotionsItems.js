var _ = require('underscore');
var parent = require('./parrent');
var custom = require('../custom');
var dataService = require('../dataService');
var CONSTANTS = require('../constants/otherConstants');
var CONTENT_TYPES = require('../constants/contentType');
var ERROR_MESSAGES = require('../constants/errorMessages');
var App = require('../appState');

module.exports = parent.extend({
    defaults      : {},
    attachmentsKey: 'comment.attachments',

    multilanguageFields: [
        'branches.comment.createdBy.user.firstName',
        'branches.comment.createdBy.user.lastName',
        'branches.comment.editedBy.user.firstName',
        'branches.comment.editedBy.user.lastName',
        'name',
        'branches.name',
        'branches.displayType.name'
    ],

    validate: function () {
        var errors = [];

        if (errors.length > 0) {
            return errors;
        }
    },

    urlRoot: function () {
        return CONTENT_TYPES.PROMOTIONSITEMS;
    },

    modelParse: function (model) {
        var currentLanguage = App.currentUser.currentLanguage;

        var statuses = CONSTANTS.PROMOTION_UI_STATUSES;

        model.branches.forEach(function (branch) {
            var status = _.findWhere(statuses, {_id: branch.status});

            if (branch.dateStart) {
                branch.dateStart = custom.dateFormater('DD.MM.YYYY', branch.dateStart);
            }

            if (branch.dateEnd) {
                branch.dateEnd = custom.dateFormater('DD.MM.YYYY', branch.dateEnd);
            }

            branch.status = status.name[currentLanguage];
        });

        return model;
    },

    editTableItemData: function (promotionItemId, data) {
        var that = this;
        var errors = 0;
        var currentLanguage = App.currentUser.currentLanguage || 'en';

        if (!data.rsp) {
            ++errors;
        }

        if (!data.dateStart) {
            ++errors;
        }

        if (!data.dateEnd) {
            ++errors;
        }

        if (!data.opening || !data.opening.length || !data.opening[0]) {
            ++errors;
        }

        if (!data.sellIn || !data.sellIn.length || !data.sellIn[0]) {
            ++errors;
        }

        if (!data.sellOut || !data.sellOut.length || !data.sellOut[0]) {
            ++errors;
        }

        if (!data.closingStock || !data.closingStock.length || !data.closingStock[0]) {
            ++errors;
        }

        if (!data.displayType || !data.displayType.length || !data.displayType[0]) {
            ++errors;
        }

        if (!data.comment || !data.comment.text) {
            ++errors;
        }

        if (errors) {
            return App.renderErrors([
                ERROR_MESSAGES.fillAllInputFields[currentLanguage],
            ]);
        }

        dataService.putData('/promotionsItems/' + promotionItemId, data, function (err) {
            if (err) {
                return App.renderErrors([
                    err.message || ERROR_MESSAGES.somethingWentWrong[currentLanguage],
                ]);
            }

            that.trigger('promotion-item-data-edited');
        });
    },

    deletePromotionItem: function (itemId) {
        var that = this;

        dataService.deleteData('/promotionsItems/' + itemId, {}, function (err) {
            if (err) {
                return App.renderErrors([
                    err.message || ERROR_MESSAGES.somethingWentWrong[currentLanguage],
                ]);
            }

            that.trigger('promotion-item-deleted');
        });
    }

});
