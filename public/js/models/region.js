define([
        'models/parrent',
        'validation',
        'constants/contentType'
    ],
    function (parent, validation, CONTENT_TYPES) {
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
                var errors = [];

                if(this.translatedFields.name){
                    validation.checkDomainNameField(errors, true, attrs.name[App.currentUser.currentLanguage], this.translatedFields.name);
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