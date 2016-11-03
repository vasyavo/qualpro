define([
        'Underscore',
        'translations/ar/pagination',
        'translations/ar/filters'
    ],
    function (_, paginationTranslation, filtersTranslation) {
        var translation = {
            all         : ' أنشطة ترويج المنافسين',
            title       : 'تقرير تقيم أنشطة ترويج المنافسين',
            category    : 'الفئة',
            brand       : 'المنافس',
            origin      : 'بلد المنشأ',
            promotion   : 'منتج الترويج',
            rsp         : 'سعر البيع للمستهلك',
            packing     : 'التغليف',
            expiry      : 'تاريخ الانتهاء',
            employee    : 'الموظف',
            country     : 'الدولة',
            region      : 'المنطقة',
            subRegion   : 'المنطقة الفرعية',
            tradeChannel: 'الفئة التجارية',
            outlet      : 'العميل',
            branch      : 'الفرع',
            displayType : 'نوع العرض',
            startDate   : 'تاريخ البدء',
            endDate     : 'تاريخ الانتهاء',
            description : 'الوصف',
            attachments : 'الملفات المرفقة',
            files       : 'الملفات',
            attach      : 'ارفاق',
            send        : 'ارسال',
            location    : 'الموقع',
            okBtn       : 'موافق',
            dialogTitle : ' التعليقات والمرفقات'
        };

        return _.extend({}, paginationTranslation, filtersTranslation, translation);
    });
