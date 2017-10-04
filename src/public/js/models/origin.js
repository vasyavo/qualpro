var parent = require('./parrent');
var CONTENT_TYPES = require('../constants/contentType');

module.exports = parent.extend({
    defaults: {
        name    : '',
        selected: false
    },

    multilanguageFields: [
        'name'
    ],

    idAttribute: '_id',

    urlRoot: function () {
        return CONTENT_TYPES.ORIGIN;
    }
});
