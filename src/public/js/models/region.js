define([
        'models/parrent',
        'validation',
        'constants/contentType',
        'constants/errorMessages'
    ],
    function (parent, validation, CONTENT_TYPES, ERROR_MESSAGES) {
        var Model = parent.extend({
            idAttribute: '_id',
            defaults   : {
                imageSrc: '',
                name    : {
                    ar: '',
                    en: ''
                }
            },

            fieldsToTranslate: [
                'name'
            ],

            multilanguageFields: [
                'name',
                'createdBy.user.firstName',
                'createdBy.user.lastName'
            ],


            validate: function (attrs) {
                var currentLanguage = App.currentUser.currentLanguage;
                var errors = [];

                if(this.translatedFields.name) {
                    var fieldValue = attrs.name[App.currentUser.currentLanguage];

                    if (!fieldValue) {
                        errors.push(ERROR_MESSAGES.region.emptyNameInput[currentLanguage]);
                    }

                    if (validation.hasInvalidChars(fieldValue)) {
                        errors.push(ERROR_MESSAGES.invalidChars[currentLanguage]);
                    }
                }

                if (errors.length > 0) {
                    return errors;
                }
            },

            urlRoot: function () {
                return CONTENT_TYPES.REGION;
            }
        });
        return Model;
    });