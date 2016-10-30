define([
    'Underscore',
    'translations/ar/pagination',
    'translations/ar/filters'
], function (_, paginationTranslation, filtersTranslation) {
    'use strict';

    var contractsSecondaryTranslation = {
        // top bar
        all                : 'العقود الثانوية',
        newContract        : 'عقد جديد',
        // list
        startDate          : 'تاريخ البدء',
        endDate            : 'تاريخ الانتهاء',
        location           : 'الموقع',
        // create
        createTitle        : 'إنشاء عقد',
        createBtn          : 'إنشاء',
        publishBtn         : 'نشر',
        cancelBtn          : 'إلغاء',
        attachments        : 'المرفقات',
        attachFiles        : 'إرفاق ملفات',
        inputActivity      : 'إدخال النشاط',
        inputPromotion     : 'إدخال الترويج',
        inputBudget        : 'إدخال الميزانية',
        inputActual        : 'إدخال التكلفة الفعلية',
        inputSalesTarget   : 'إدخال المبيعات المستهدفة',
        selectCountry      : 'اختر الدولة',
        selectRegion       : 'اختر المنطقة',
        selectSubRegion    : 'اختر المنطقة الفرعية',
        selectRetailSegment: 'اختر قطاع التجزئة',
        selectOutlet       : 'اختر العميل',
        selectBranch       : 'اختر الفرع',
        // edit
        editTitle          : 'تعديل بيانات العقد',
        duplicate          : 'تكرار العقد',
        saveBtn            : 'حفظ',
        // preview
        okBtn              : 'موافق',
        preViewTitle       : 'عرض العقد',
        editBtn            : 'تعديل',
        edit               : 'تعديل',
        duplicateBtn       : 'تكرار',
        type               : 'النوع',
        category           : 'الفئة',
        activity           : 'النشاط',
        promotion          : 'النشاط الترويجي',
        displayType        : 'نوع العرض',
        budget             : 'الميزانية',
        actual             : 'الميزانية الفعلية',
        salesTarget        : 'المبيعات المستهدفة',
        country            : 'الدولة',
        region             : 'المنطقة',
        subRegion          : 'المنطقة الفرعية',
        retailSegment      : 'قطاع التجزئة',
        outlet             : 'العميل',
        branch             : 'الفرع',
        status             : 'الحالة',
        description        : 'الوصف',
        noInfo             : 'لا توجد معلومات',
        addTranslation     : {
            en: 'إضافة الترجمة العربية',
            ar: 'إضافة الترجمة الانجليزية'
        },


        attach          : 'ارفاق',
        documentFile    : 'الوثائق والملفات',
        titleInput      : 'ادخل العنوان',
        title           : 'العنوان',
        attachButtonName: 'وثيقة جديدة',
        dialogTitle     : 'جميع الوثائق',
        selectCategory  : 'اختر الفئة',
        goToBtn         : 'الذهاب الى',
        rightTitle      : 'المستندات المرفقة'
    };

    return _.extend({}, paginationTranslation, filtersTranslation, contractsSecondaryTranslation);
});
