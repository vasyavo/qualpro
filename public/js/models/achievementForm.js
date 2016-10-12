define([
    'models/parrent',
    'validation',
    'constants/contentType'
], function (parent, validation, CONTENT_TYPES) {
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
            model.location = model.countryString + '>' + model.regionString + '>' + model.subRegionString + '>' + model.retailSegmentString + '>' + model.outletString + '>' + model.branchString;

            return model;
        }
    });

    return Model;
});
