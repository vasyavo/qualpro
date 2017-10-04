var parrent = require('./parrent');
var App = require('../appState');

module.exports = parrent.extend({
    idAttribute: "_id",

    defaults: {
        name  : '',
        status: false
    },

    multilanguageFields: [
        'name'
    ],

    modelParse: function (model) {
        var currentLanguage = App && App.currentUser && App.currentUser.currentLanguage ? App.currentUser.currentLanguage : 'en';
        var anotherLanguage = currentLanguage === 'en' ? 'ar' : 'en';
        if (model.name && model.name.currentLanguage === ' ') {
            model.name.currentLanguage = model.name[anotherLanguage];
        }
        return model;
    }
});
