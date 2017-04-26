define([
        'models/parrent',
        'validation',
        'constants/contentType',
        'constants/errorMessages',
        'dataService'
    ],
    function (parent, validation, CONTENT_TYPES, ERROR_MESSAGES, dataService) {
        var Model = parent.extend({
            defaults      : {},
            attachmentsKey: 'attachments',

            multilanguageFields: [
                'description',
                'createdBy.user.firstName',
                'createdBy.user.lastName',
                'createdBy.user.accessRole.name',
                'createdBy.user.position.name',
                'category.name',
                'brand.name',
                'country.name',
                'region.name',
                'subRegion.name',
                'retailSegment.name',
                'outlet.name',
                'branch.name',
                'origin.name',
                'displayType.name'
            ],

            validate: function (attrs) {
                var errors = [];

                if (errors.length > 0) {
                    return errors;
                }
            },

            urlRoot: function () {
                return CONTENT_TYPES.COMPETITORPROMOTION;
            },

            edit: function (competitorPromotionId, data) {
                var that = this;

                dataService.putData('/competitorPromotion/' + competitorPromotionId, data, function (err, response) {
                    if (err) {
                        return App.renderErrors([
                            err.message || ERROR_MESSAGES.somethingWentWrong[App.currentUser.currentLanguage],
                        ]);
                    }

                    that.trigger('competitor-promotion-edited', response);
                });
            }
        });

        return Model;
    });

