define([
    'Underscore',
    'translations/ar/pagination',
    'translations/ar/filters'
], function (_, paginationTranslation, filtersTranslation) {
    'use strict';

    var translation = {
        // top bar
        notifications        : 'الإخطارات',
        newNotification      : 'إخطار جديد',
        // list
        location             : 'الموقع',
        // create
        createNotification   : 'إنشاء إخطار',
        cancelBtn            : 'إلغاء',
        description          : 'الوصف',
        sendBtn              : 'أرسال',
        inputCountryName     : 'ادخل اسم الدولة',
        inputRegionName      : 'ادخل اسم المنطقة',
        inputSubRegionName   : 'ادخل اسم المنطقة الفرعية',
        inputTradeChannelName: 'ادخل اسم قطاع التجزئة',
        inputOutletName      : 'ادخل اسم العميل',
        inputBranchName      : 'ادخل اسم الفرع',
        inputPositionName    : 'ادخل المركز الوظيفي',
        inputEmployeeName    : 'ادخل اسم الموظف',
        // preview
        viewNotification     : 'عرض الإخطارات',
        country              : 'الدولة',
        region               : 'المنطقة',
        subRegion            : 'المنطقة الفرعية',
        tradeChannel         : 'قطاع التجزئة',
        outlet               : 'العميل',
        branch               : 'الفرع',
        position             : 'المركز الوظيفي',
        employee             : 'الموظف',
        date                 : 'التاريخ',
        okBtn                : 'موافق',
        addTranslation       : {
            en: 'إضافة الترجمة العربية',
            ar: 'إضافة الترجمة الانجليزية'
        },
        type           : 'النوع',

        goToBtn: 'الذهاب الى'
    };
    return _.extend({}, paginationTranslation, filtersTranslation, translation);
});
