define([
    'models/parrent',
    'validation',
    'constants/contentType'
], function (parent, validation, CONTENT_TYPES) {
    var Model = parent.extend({
        defaults: {},

        fieldsToTranslate: [
            'name',
            'barcode',
            'packing',
            'ppt',
            'pptPerCase',
            'rspMin',
            'rspMax',
            'origin'
        ],

        multilanguageFields: [
            'name',
            'variants.items.origin.name',
            'variant.items.origin.name',
            'origin.name'
        ],

        validate: function (attrs) {
            var errors = [];

            if (this.translatedFields.name) {
                validation.checkNameField(errors, true, attrs.name, this.translatedFields.name);
            }
            if (this.translatedFields.barcode) {
                validation.checkNumberField(errors, true, attrs.barCode, this.translatedFields.barcode);
            }
            if (this.translatedFields.packing) {
                validation.checkZipField(errors, true, attrs.packing, this.translatedFields.packing);
            }
            if (this.translatedFields.ppt) {
                validation.checkPriceField(errors, true, attrs.ppt, this.translatedFields.ppt);
            }
            if (this.translatedFields.pptPerCase) {
                validation.checkPriceField(errors, true, attrs.pptPerCase, this.translatedFields.pptPerCase);
            }
            if (this.translatedFields.rspMin) {
                validation.checkPriceField(errors, true, attrs.rspMin, this.translatedFields.rspMin);
            }
            if (this.translatedFields.rspMax) {
                validation.checkPriceField(errors, true, attrs.rspMax, this.translatedFields.rspMax);
            }
            if (this.translatedFields.origin) {
                validation.checkForValuePresence(errors, true, attrs.origin, this.translatedFields.origin);
            }

            if (errors.length > 0) {
                return errors;
            }
        },

        urlRoot   : function () {
            return CONTENT_TYPES.ITEM;
        },
        modelParse: function (model) {
            var currentLanguage = App && App.currentUser && App.currentUser.currentLanguage ? App.currentUser.currentLanguage : 'en';
            if (model.category && model.category.name) {
                model.category.name.currentLanguage = model.category.name[currentLanguage];
            }
            if (model.variant && model.variant.name) {
                model.variant.name.currentLanguage = model.variant.name[currentLanguage];
            }
            return model;
        }
    });

    return Model;
});
