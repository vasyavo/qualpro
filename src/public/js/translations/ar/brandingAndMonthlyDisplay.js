define([
    'Underscore',
    'translations/en/pagination',
    'translations/en/filters'
], function (_, paginationTranslation, filtersTranslation) {
    var translation = {
        // list view
        brand      : 'arab', // todo
        category   : 'arab', // todo
        displayType: 'arab', // todo
        startDate  : 'arab', // todo
        endDate    : 'arab', // todo
        location   : 'arab', // todo

        // preview
        titlePreview : 'arab', // todo
        country      : 'arab', // todo
        region       : 'arab', // todo
        subRegion    : 'arab', // todo
        retailSegment: 'arab', // todo
        outlet       : 'arab', // todo
        branch       : 'arab', // todo
        description  : 'arab', // todo
        attachments  : 'arab', // todo
        files        : 'arab', // todo
        attachBtn    : 'arab', // todo
        sendBtn      : 'arab', // todo
        noTranslation: 'arab', // todo
        skipped      : 'arab', // todo
        commentText  : 'arab', // todo
        missedData   : 'arab', // todo
        edit         : 'تعديل بيانات',
        delete: 'arab', // todo

        // edit
        saveBtn      : 'حفظ',
        brandingAndMonthlyDisplayEditTitle: 'arab', // todo

        // topBar
        all        : 'arab', // todo
        okBtn      : 'arab', // todo
        dialogTitle: 'arab' // todo
    };
    return _.extend({}, paginationTranslation, filtersTranslation, translation);
});
