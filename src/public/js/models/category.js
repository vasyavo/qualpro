define([
        'models/parrent',
        'validation',
        'constants/contentType',
        'constants/errorMessages',
        'dataService'
    ],
    function (parent, validation, CONTENT_TYPES, ERROR_MESSAGES, dataService) {
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
                    validation.checkNameField(errors, true, attrs.name, this.translatedFields.name);
                }

                if (errors.length > 0) {
                    return errors;
                }
            },

            urlRoot: function () {
                return CONTENT_TYPES.CATEGORY;
            },

            updateCategoryInformation: function (category, arrayOfFilesId) {
                var that = this;

                dataService.putData('/category', {
                    products: [category],
                    information: arrayOfFilesId
                }, function (err) {
                    if (err) {
                        return App.renderErrors([
                            ERROR_MESSAGES.somethingWentWrong[App.currentUser.currentLanguage]
                        ]);
                    }

                    that.trigger('category-information-updated');
                });
            }
        });

        return Model;
    });