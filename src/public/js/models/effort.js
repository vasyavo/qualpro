var parent = require('./parrent');

module.exports = parent.extend({
    defaults: {},

    validate: function (attrs) {
        var errors = [];

        if (errors.length > 0) {
            return errors;
        }
    },

    urlRoot: function () {
        return '/form/visibility';
    }
});
