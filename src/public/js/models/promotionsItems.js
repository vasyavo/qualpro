define([
        'Underscore',
        'models/parrent',
        'custom',
        'constants/otherConstants',
        'constants/contentType',
        'constants/errorMessages',
        'dataService'
    ],
    function (_, parent, custom, CONSTANTS, CONTENT_TYPES, ERROR_MESSAGES, dataService) {
        var Model = parent.extend({
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

                dataService.putData('/promotionItems/' + promotionItemId, data, function (err) {
                    if (err) {
                        return App.renderErrors([
                            err.message || ERROR_MESSAGES.somethingWentWrong[currentLanguage],
                        ]);
                    }

                    that.trigger('promotion-item-data-edited');
                });
            }

        });

        return Model;
    });
