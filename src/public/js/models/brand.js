define([
        'models/parrent',
        'validation',
        'constants/contentType'
    ],
    function (parent, validation, CONTENT_TYPES) {
        var Model = parent.extend({
            defaults: {},

            fieldsToTranslate: [
                'name'
            ],

            multilanguageFields: [
                'name'
            ],

            validate: function (attrs) {
                var errors = [];

                if(this.translatedFields.name){
                    validation.checkDomainNameField(errors, true, attrs.name[App.currentUser.currentLanguage], this.translatedFields.name);
                }

                if (errors.length > 0) {
                    return errors;
                }
            },

            urlRoot: function () {
                return CONTENT_TYPES.BRAND;
            }
        });

        return Model;
    });