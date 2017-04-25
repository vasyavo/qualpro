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
                return CONTENT_TYPES.PRICESURVEY + '/brands';
            },

            editValueOfPriceSurveyItem: function (options) {
                var that = this;
                dataService.putData('/priceSurvey/' + options.priceSurveyId + '/item/' + options.priceSurveyItemId, {
                    price: options.price,
                }, function (err) {
                    if (err) {
                        return App.renderErrors([
                            ERROR_MESSAGES.somethingWentWrong[App.currentUser.currentLanguage],
                            'Edit price survey value',
                        ]);
                    }

                    that.trigger('price-survey-value-edited');
                });
            }

        });
        return Model;
    });
