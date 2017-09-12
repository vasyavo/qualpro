define([
    'Underscore',
    'translations/ar/pagination',
    'translations/ar/filters'
], function (_, paginationTranslation, filtersTranslation) {
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
    return _.extend({}, paginationTranslation, filtersTranslation, translation);
});
