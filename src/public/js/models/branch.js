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
                var currentLanguage = App.currentUser.currentLanguage;
                var errors = [];

                if(this.translatedFields.name) {
                    var fieldValue = attrs.name[App.currentUser.currentLanguage];

                    if (!fieldValue) {
                        errors.push(ERROR_MESSAGES.branch.emptyNameInput[currentLanguage]);
                    } else if (validation.hasInvalidChars(fieldValue)) {
                        errors.push(ERROR_MESSAGES.invalidChars[currentLanguage]);
                    }
                }

                if(this.translatedFields.retailSegment){
                    validation.checkForValuePresence(errors, true, attrs.retailSegment, this.translatedFields.retailSegment);
                }

                if(this.translatedFields.outlet) {
                    var fieldValue = attrs.name[App.currentUser.currentLanguage];

                    if (!fieldValue) {
                        errors.push(ERROR_MESSAGES.branch.emptyOutletInput[currentLanguage]);
                    } else if (Array.isArray(fieldValue) && !fieldValue.length) {
                        errors.push(ERROR_MESSAGES.branch.emptyOutletInput[currentLanguage]);
                        return;
                    }
                }

                if(this.translatedFields.address) {
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