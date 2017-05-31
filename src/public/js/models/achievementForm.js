define([
    'models/parrent',
    'validation',
    'constants/contentType',
    'custom',
    'constants/errorMessages',
    'dataService',
], function (parent, validation, CONTENT_TYPES, custom, ERROR_MESSAGES, dataService) {
    var Model = parent.extend({
        defaults      : {},
        attachmentsKey: 'attachments',

        multilanguageFields: [
            'description',
            'additionalComment',
            'location',
            'createdBy.user.firstName',
            'createdBy.user.lastName',
            'createdBy.user.accessRole.name',
            'createdBy.user.position.name',
            'country.name',
            'region.name',
            'subRegion.name',
            'retailSegment.name',
            'outlet.name',
            'branch.name'
        ],

        validate: function (attrs) {
            var errors = [];

            if (errors.length > 0) {
                return errors;
            }
        },

        urlRoot: function () {
            return CONTENT_TYPES.ACHIEVEMENTFORM;
        },

        modelParse: function (model) {
            model.countryString = model.country ? model.country.name.currentLanguage : '';
            model.regionString = model.region ? model.region.name.currentLanguage : '';
            model.subRegionString = model.subRegion ? model.subRegion.name.currentLanguage : '';
            model.retailSegmentString = model.retailSegment ? model.retailSegment.name.currentLanguage : '';
            model.outletString = model.outlet ? model.outlet.name.currentLanguage : '';
            model.branchString = model.branch ? model.branch.name.currentLanguage : '';
            model.startDate = model.startDate ?  custom.dateFormater('DD.MM.YYYY', model.startDate) : '';
            model.endDate = model.endDate ? custom.dateFormater('DD.MM.YYYY', model.endDate) : '';
            model.location = model.countryString + '>' + model.regionString + '>' + model.subRegionString + '>' + model.retailSegmentString + '>' + model.outletString + '>' + model.branchString;

            return model;
        },

        edit: function (achievementFormId, data) {
            var that = this;
            var currentLanguage = App.currentUser.currentLanguage;

            dataService.putData('/achievementForm/' + achievementFormId, data, function (err, response) {
                if (err) {
                    return App.renderErrors([
                        err.message || ERROR_MESSAGES.somethingWentWrong[currentLanguage],
                    ]);
                }

                that.trigger('achievement-form-edited', response);
            });
        },

        delete: function (achievementFormId) {
            var that = this;

            dataService.deleteData('/achievementForm/' + achievementFormId, {}, function (err) {
                if (err) {
                    return App.renderErrors([
                        err.message || ERROR_MESSAGES.somethingWentWrong[currentLanguage],
                    ]);
                }

                that.trigger('achievement-form-deleted');
            });
        }
    });

    return Model;
});
