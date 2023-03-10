var parent = require('./parrent');

module.exports = parent.extend({
    defaults: {
        currentLanguage: 'en'
    },

    multilanguageFields: [
        'category.name',
        'category.variant.name',
        'category.variant.item.name',
        'branches.name',
        'branches.outlet.name'
    ],

    validate: function () {
        var errors = [];

        if (errors.length > 0) {
            return errors;
        }
    },

    urlRoot: function () {
        return '/form/distribution';
    }
});
