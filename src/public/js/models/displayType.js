var parent = require('./parrent');
var CONTENT_TYPES = require('../constants/contentType');

module.exports = parent.extend({
    defaults: {},

    multilanguageFields: [
        'name'
    ],

    urlRoot: function () {
        return CONTENT_TYPES.DISPLAYTYPE;
    }
});
