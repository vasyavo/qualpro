define([
        'Underscore',
        'models/parrent',
        'validation',
        'constants/contentType'
    ],
    function (_, parent, validation, CONTENT_TYPES) {
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

            validate: function (attrs, options) {
                var errors = [];

                if(this.translatedFields.name){
                    validation.checkDomainNameField(errors, true, attrs.name[App.currentUser.currentLanguage], this.translatedFields.name);
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