define([
    'Underscore',
    'translations/ar/pagination',
    'translations/ar/filters'
], function (_, paginationTranslation, filtersTranslation) {
    'use strict';

    var documentsTranslation = {
        // top bar
        all        : 'الوثائق',
        archive    : 'الأرشيف',
        newDocument: 'وثيقة جديدة',
        selectAll  : 'اختيار الكل',
        action     : 'اتخاذ إجراء',
        disable    : ' إلغاء تفعيل',
        unDisable  : 'إعادة تفعيل',
        delete     : 'حذف',
        copyButton : 'نسخ',
        cutButton  : 'قص',
        pasteButton: 'لصق',
        root       : 'من خلال',
        // list

        // create
        createTitle      : 'إنشاء وثيقة',
        createFolderTitle: 'أنشئ مجلد',
        titleInput       : 'إدخال عنوان النص',
        title            : 'عنوان النص',
        createBtn        : 'إنشاء',
        cancelBtn        : ' إلغاء',
        attachments      : 'المرفقات',
        attachFiles      : 'إرفاق ملفات',
        // edit
        editTitle        : 'تعديل الوثيقة',
        saveBtn          : 'حفظ',
        // preview
        okBtn            : 'موافق',
        preViewTitle     : 'عرض الوثيقة',
        attach           : 'ارفاق',
        documentFile     : 'الوثائق والملفات',
        goToBtn          : 'الذهاب الى',

    };

    return _.extend({}, paginationTranslation, filtersTranslation, documentsTranslation);
});
