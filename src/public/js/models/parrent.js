var Backbone = require('backbone');
var Cookies = require('js-cookie');
var custom = require('../custom');
var FilesCollection = require('../collections/file/collection');
var App = require('../appState');

module.exports = Backbone.Model.extend({
    idAttribute: '_id',

    initialize: function () {
        this.on('invalid', function (model, errors) {
            App.renderErrors(errors);
        });
    },

    setAttachments: function (model) {
        var filesCollection = new FilesCollection(model[this.attachmentsKey]);

        model[this.attachmentsKey] = filesCollection.toJSON();
    },

    setFieldsNames: function (translation, attr) {
        this.translatedFields = {};
        var self = this;
        if (attr) {
            Object.keys(attr).forEach(function (key) {
                self.translatedFields[key] = translation[key];
            });
        } else {
            self.fieldsToTranslate.forEach(function (key) {
                self.translatedFields[key] = translation[key];
            });
        }
    },

    setCurrentLanguage: function (model) {
        var currentLanguage = (App.currentUser && App.currentUser.currentLanguage) ||
            Cookies.get('currentLanguage') || 'en';
        var anotherLanguage = (currentLanguage === 'en') ? 'ar' : 'en';
        var value;

        var getCurrentLanguage = function (value) {
            if (Array.isArray(value)) {
                value.forEach(function (valueItem) {
                    getCurrentLanguage(valueItem);
                });
            } else {
                addCurrentLanguage(value);
            }
        };

        var addCurrentLanguage = function (value) {
            if (value !== null && typeof value === 'object' && (value.en || value.ar)) {
                value.currentLanguage = value[currentLanguage] || value[anotherLanguage];
            }
        };

        if (this.multilanguageFields) {
            this.multilanguageFields.forEach(function (field) {
                value = model.getNestedProperty(field);
                getCurrentLanguage(value);
            });

        }
    },

    parse: function (model) {
        if (model.createdBy && model.createdBy.date) {
            model.createdBy.date = custom.dateFormater('DD.MM.YYYY', model.createdBy.date);
        }

        if (model.creationDate) {
            model.creationDate = custom.dateFormater('DD.MM.YYYY', model.creationDate);
        }

        if (model.lastAccess) {
            model.lastAccess = custom.dateFormater('DD.MM.YYYY', model.lastAccess);
        }

        if (model.dateJoined) {
            model.dateJoined = custom.dateFormater('DD.MM.YYYY', model.dateJoined);
        }

        if (model.dateStart) {
            model.dateStart = custom.dateFormater('DD.MM.YYYY', model.dateStart);
        }

        if (model.dateEnd) {
            model.dateEnd = custom.dateFormater('DD.MM.YYYY', model.dateEnd);
        }

        if (model.expiry) {
            model.expiry = custom.dateFormater('DD.MM.YYYY', model.expiry);
        }

        if (model.dueDate) {
            model.dueDate = custom.dateFormater('DD.MM.YYYY', model.dueDate);
        }

        if (model.shelfLifeStart) {
            model.shelfLifeStart = custom.dateFormater('DD.MM.YYYY', model.shelfLifeStart);
        }

        if (model.shelfLifeEnd) {
            model.shelfLifeEnd = custom.dateFormater('DD.MM.YYYY', model.shelfLifeEnd);
        }

        if (model.author) {
            model.author.date = custom.dateFormater('DD.MM.YYYY', model.author.date);
        }

        if (model.timeStamp) {
            model.timeStamp = custom.dateFormater('DD.MM.YYYY', model.timeStamp);
        }

        this.setCurrentLanguage(model);

        if (this.attachmentsKey) {
            this.setAttachments(model);
        }

        if (this.modelParse && typeof this.modelParse === 'function') {
            this.modelParse(model);
        }

        model.parsed = true;

        return model;
    }
});
