define([
        'models/parrent',
        'validation',
        'constants/contentType'
    ],
    function (parent, validation, CONTENT_TYPES) {
        var Model = parent.extend({
            defaults: {},

            fieldsToTranslate: [
                'name',
                'packing',
                'origin'
            ],

            multilanguageFields: [
                'name',
                'origin.name'
            ],

            validate: function (attrs) {
                var errors = [];

                if(this.translatedFields.name){
                    validation.checkNameField(errors, true, attrs.name, this.translatedFields.name);
                }
                if(this.translatedFields.packing){
                    validation.checkZipField(errors, true, attrs.packing, this.translatedFields.packing);
                }
                if(this.translatedFields.origin){
                    validation.checkForValuePresence(errors, true, attrs.origin, this.translatedFields.origin);
                }

                if (errors.length > 0) {
                    return errors;
                }
            },

            urlRoot: function () {
                return CONTENT_TYPES.COMPETITORITEM;
            }
        });

        return Model;
    });
