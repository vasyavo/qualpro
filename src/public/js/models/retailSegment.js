define([
        'Underscore',
        'models/parrent',
        'validation',
        'constants/contentType',
        'constants/errorMessages'
    ],
    function (_, parent, validation, CONTENT_TYPES, ERROR_MESSAGES) {
        var Model = parent.extend({
            idAttribute: '_id',
            defaults   : {
                imageSrc: '',
                name    : {
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
                        errors.push(ERROR_MESSAGES.retailSegment.emptyNameInput[currentLanguage]);
                    } else if (validation.hasInvalidChars(fieldValue)) {
                        errors.push(ERROR_MESSAGES.invalidChars[currentLanguage]);
                    }
                }

                if (errors.length > 0) {
                    return errors;
                }
            },

            getConfigurations: function () {
                var configurations = this.get('configurations');

                return _.filter(configurations, function (configuration) {
                    return !configuration.archived;
                });
            },

            urlRoot: function () {
                return CONTENT_TYPES.RETAILSEGMENT;
            }
        });
        return Model;
    });