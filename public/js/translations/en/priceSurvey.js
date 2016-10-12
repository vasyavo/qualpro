define([
        'Underscore',
        'translations/en/pagination',
        'translations/en/filters'
    ],
    function (_, paginationTranslation, filtersTranslation) {
        var priceSurveyTranslation = {
            // body
            max: 'max',
            mid: 'mid',
            min: 'min',
            avg: 'avg',

            // header
            total   : 'Total',
            brand   : 'Brand',
            variants: 'Variants',
            size    : 'Size',
            origin  : 'Origin',
            gms     : '(GMS.)',

            // list
            product : 'Product',
            category: 'category',

            // preview
            timeStamp: 'Time Stamp',
            branch   : 'Branch',
            value    : 'Value',
            employee : 'Employee',

            // topBar
            all: 'Price Survey'
        };
        return _.extend({}, paginationTranslation, filtersTranslation, priceSurveyTranslation);
    });