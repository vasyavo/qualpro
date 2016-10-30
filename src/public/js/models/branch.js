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
                    en: ''
                }
            },

            fieldsToTranslate: [
                'name',
                'retailSegment',
                'outlet',
                'address'
            ],

            multilanguageFields: [
                'name',
                'retailSegment.name',
                'outlet.name',
                'createdBy.user.firstName',
                'createdBy.user.lastName',
                'address'
            ],

            validate: function (attrs) {
                var errors = [];

                if(this.translatedFields.name){
                    validation.checkNameField(errors, true, attrs.name, this.translatedFields.name);
                }
                if(this.translatedFields.retailSegment){
                    validation.checkForValuePresence(errors, true, attrs.retailSegment, this.translatedFields.retailSegment);
                }
                if(this.translatedFields.outlet){
                    validation.checkForValuePresence(errors, true, attrs.outlet, this.translatedFields.outlet);
                }
                if(this.translatedFields.address){
                    validation.checkForValuePresence(errors, true, attrs.address[App.currentUser.currentLanguage], this.translatedFields.address);
                }

                if (errors.length > 0) {
                    return errors;
                }
            },

            urlRoot: function () {
                return CONTENT_TYPES.BRANCH;
            }
        });
        return Model;
    });