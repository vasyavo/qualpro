define([
        'models/parrent',
        'validation',
        'constants/contentType'
    ],
    function (parent, validation, CONTENT_TYPES) {
        var Model = parent.extend({
            defaults      : {},
            attachmentsKey: 'attachments',

            multilanguageFields: [
                'distributor',
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
                'branch.name',
                'category.name',
                'variant.name',
                'brand.name',
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
                return CONTENT_TYPES.NEWPRODUCTLAUNCH;
            },

            modelParse: function (model) {
                model.displayTypeString = model.displayType ? model.displayType.name.currentLanguage : '';
                return model;
            }
        });

        return Model;
    });


