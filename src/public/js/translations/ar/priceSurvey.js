define([
        'Underscore',
        'translations/ar/pagination',
        'translations/ar/filters'
    ],
    function (_, paginationTranslation, filtersTranslation) {
        var priceSurveyTranslation = {
            // body
            max: 'الاقصى',
            mid: ' منتصف',
            min: 'الأدنى',
            avg: ' متوسط ',

            // header
            total   : 'المجموع الكلى',
            brand   : 'المنافس',
            variants: 'المنوع',
            size    : 'الحجم',
            origin  : 'بلد المنشأ',
            gms     : '(كلغ.)',

            // list
            product : 'المننج',
            category: 'الفئة',

            // preview
            timeStamp: 'وقت الدخول',
            branch   : 'الفرع',
            value    : 'القيمة',
            employee : 'الموظف',

            // topBar

            all: ' الدراسة الاستقصائية للأسعار'
        };
        return _.extend({}, paginationTranslation, filtersTranslation, priceSurveyTranslation);
    });