define([
        'models/parrent',
        'validation',
        'constants/contentType',
        'constants/errorMessages',
        'dataService'
    ],
    function (parent, validation, CONTENT_TYPES, ERROR_MESSAGES, dataService) {
        var Model = parent.extend({
            idAttribute: '_id',

            multilanguageFields: [
                'branch.name',
                'brand.name',
                'category.name',
                'employee.name'
            ],

            urlRoot: function () {
                return CONTENT_TYPES.SHELFSHARES;
            },

            editValueOfShelfSharesItem: function (options) {
                var that = this;
                dataService.putData('/shelfShares/' + options.shelfSharesId + '/item/' + options.shelfSharesItemId, {
                    length: options.value,
                }, function (err) {
                    if (err) {
                        return App.renderErrors([
                            ERROR_MESSAGES.somethingWentWrong[App.currentUser.currentLanguage],
                            'Edit shelf share item value',
                        ]);
                    }

                    that.trigger('shelf-shares-value-edited');
                });
            },

            deleteItem: function (priceSurveyId, itemId) {
                var that = this;

                dataService.deleteData('/shelfShares/' + priceSurveyId + '/item/' + itemId, {}, function (err) {
                    if (err) {
                        return App.renderErrors([
                            ERROR_MESSAGES.somethingWentWrong[App.currentUser.currentLanguage],
                            'Delete shelf share item',
                        ]);
                    }

                    that.trigger('shelf-shares-value-deleted');
                });
            }
        });
        return Model;
    });
