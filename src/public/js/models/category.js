define([
        'models/parrent',
        'validation',
        'constants/contentType',
        'constants/errorMessages'
    ],
    function (parent, validation, CONTENT_TYPES, ERROR_MESSAGES) {
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

            uploadProductInformation: function (file) {
                var that = this;
                var formData = new FormData();
                formData.append('file', file);

                $.ajax({
                    url : '/file',
                    method : 'POST',
                    data : formData,
                    contentType: false,
                    processData: false,
                    success : function (response) {
                        that.trigger('file-uploaded', response);
                    },
                    error : function () {
                        App.renderErrors([
                            ERROR_MESSAGES.fileIsNotUploaded[App.currentUser.currentLanguage]
                        ]);
                    }
                });
            }
        });

        return Model;
    });