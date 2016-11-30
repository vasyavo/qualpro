define([
        'models/parrent',
        'validation',
        'custom',
        'constants/otherConstants',
        'constants/contentType'
    ],
    function (parent, validation, custom, CONSTANTS, CONTENT_TYPES) {
        var Model = parent.extend({
            defaults: {},
            attachmentsKey: 'attachments',

            multilanguageFields: [
                'description',
                'location',
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
                'displayType.name'
            ],

            validate: function (attrs) {
                var errors = [];

                if (errors.length > 0) {
                    return errors;
                }
            },

            urlRoot: function () {
                return CONTENT_TYPES.COMPETITORBRANDING;
            },

            modelMapper: function (key, model) {
                return model[key] ? _.map(model[key], function (el) {
                    return el.name.currentLanguage || ' ';
                }).join(', ') : ' ';
            },

            modelParse: function (model) {
                model.categoryString = this.modelMapper('category', model);
                model.countryString = model.country ? model.country.name.currentLanguage : '';
                model.regionString = model.region ? model.region.name.currentLanguage : '';
                model.subRegionString = model.subRegion ? model.subRegion.name.currentLanguage : '';
                model.retailSegmentString = model.retailSegment ? model.retailSegment.name.currentLanguage : '';
                model.outletString = model.outlet ? model.outlet.name.currentLanguage : '';
                model.branchString = model.branch ? model.branch.name.currentLanguage : '';
                model.brandString = model.brand ? model.brand.name.currentLanguage : '';
                model.displayTypeString = (model.displayType && model.displayType.length) ? model.displayType.name.currentLanguage : '';

                model.location = model.countryString + '>' + model.regionString + '>' + model.subRegionString + '>' + model.retailSegmentString + '>' + model.outletString + '>' + model.branchString;
            }
        });

        return Model;
    });
