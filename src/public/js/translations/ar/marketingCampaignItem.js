var _ = require('underscore');
var paginationTranslation = require('./pagination');
var filtersTranslation = require('./filters');

var translation = {
    // header
    brandingItemsTable: ' جدول العلامات التجارية وتقارير العرض للسلع',
    employee          : 'الموظف',
    comment           : 'التعليق',

    // body
    createdBy: ' تم إنشاؤها بواسطة',
    edit         : 'تعديل بيانات',
    delete: 'حذف',
    editCommentViewTitle: 'تعديل التعليقات الخاصة بحملة العلالي التسويقية والدعائية',
};

module.exports = _.extend({}, paginationTranslation, filtersTranslation, translation);
