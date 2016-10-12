define([
        'Underscore',
        'translations/en/filters'
    ],
    function (_, filtersTranslation) {
        return _.extend({}, {
            title    : 'Crop Image',
            cancelBtn: 'Cancel',
            cropBtn  : 'Crop'
        }, filtersTranslation);
    });