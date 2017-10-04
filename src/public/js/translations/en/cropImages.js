var _ = require('underscore');
var filtersTranslation = require('./filters');

module.exports = _.extend({}, {
    title    : 'Crop Image',
    cancelBtn: 'Cancel',
    cropBtn  : 'Crop'
}, filtersTranslation);
