var _ = require('underscore');
var filtersTranslation = require('./filters');

module.exports = _.extend({}, {
    title    : ' تحديد جزء من الصورة',
    cancelBtn: 'إلغاء',
    cropBtn  : 'تحديد'
}, filtersTranslation);
