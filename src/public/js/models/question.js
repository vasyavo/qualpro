define([
        'models/parrent',
        'validation'
    ],
    function (parent, validation) {
        var Model = parent.extend({

            fieldsToTranslate: [
                'title',
                'type',
                'options'
            ],

            urlRoot: function () {
                return '/question';
            },

            validate: function (attrs, cb) {
                var currentLanguage = App && App.currentUser && App.currentUser.currentLanguage ? App.currentUser.currentLanguage : 'en';
                var errors = [];
                var optionsRequired = attrs.type !== 'fullAnswer';

                if (this.translatedFields.title) {
                    validation.checkTitleField(errors, true, attrs.title, this.translatedFields.title);
                }
                if (this.translatedFields.type) {
                    validation.checkForValuePresence(errors, true, attrs.type, this.translatedFields.type);
                }
                if (this.translatedFields.options && optionsRequired) {
                    validation.checkForValuePresence(errors, true, attrs.options.length, this.translatedFields.options);
                }

                if (errors.length > 0) {
                    return cb(errors);
                }
                return cb(null);
            }
        });
        return Model;
    });