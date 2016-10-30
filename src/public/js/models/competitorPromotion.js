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
            }
        });

        return Model;
    });

