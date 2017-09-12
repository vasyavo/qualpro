define([
        'Underscore',
        'translations/en/pagination',
        'translations/en/filters'
    ],
    function (_, paginationTranslation, filtersTranslation) {
        var shelfSharesTranslation = {
            // body
            max: 'max',
            mid: 'mid',
            min: 'min',

            // header
            total: 'Total 100%',
            brand: 'Brand',

            // list
            product: 'Product',

            // preview
            timeStamp: 'Time Stamp',
            branch   : 'Branch',
            value    : 'Value',
            employee : 'Employee',
            options  : 'Options',
            saveBtn  : 'Save',
            delete: 'Delete',
            edit: 'Edit',

            // top Bar
            all: 'Shelf shares',
        };
        return _.extend({}, paginationTranslation, filtersTranslation, shelfSharesTranslation);
    });