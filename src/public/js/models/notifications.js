define([
        'models/parrent',
        'validation',
        'constants/contentType'
    ],
    function (parent, validation, CONTENT_TYPES) {
        var Model = parent.extend({

            fieldsToTranslate: [
                'country',
                'description'
            ],

            multilanguageFields: [
                'description',
                'country.name',
                'region.name',
                'subRegion.name',
                'outlet.name',
                'retailSegment.name',
                'branch.name'
            ],

            validate: function (attrs) {
                var errors = [];

                if(this.translatedFields.country){
                    validation.checkDomainNameField(errors, true, attrs.country, this.translatedFields.country);
                }
                if(this.translatedFields.description){
                    validation.checkDescriptionField(errors, true, attrs.description, this.translatedFields.description);
                }

                if (errors.length > 0) {
                    return errors;
                }
            },

            urlRoot: function () {
                return CONTENT_TYPES.NOTIFICATIONS;
            }
        });

        return Model;
    });
