define([
    'Underscore',
    'translations/en/pagination',
    'translations/en/filters'
], function (_, paginationTranslation, filtersTranslation) {
    var translation = {
        // list view
        brand      : '', // todo
        category   : '', // todo
        displayType: '', // todo
        startDate  : '', // todo
        endDate    : '', // todo
        location   : '', // todo

        // preview
        titlePreview : '', // todo
        country      : '', // todo
        region       : '', // todo
        subRegion    : '', // todo
        retailSegment: '', // todo
        outlet       : '', // todo
        branch       : '', // todo
        description  : '', // todo
        attachments  : '', // todo
        files        : '', // todo
        attachBtn    : '', // todo
        sendBtn      : '', // todo
        noTranslation: '', // todo
        skipped      : '', // todo
        commentText  : '', // todo
        missedData   : '', // todo
        edit         : 'تعديل بيانات',

        // edit
        saveBtn: '', // todo
        brandingAndMonthlyDisplayEditTitle: '', // todo

        // topBar
        all        : '', // todo
        okBtn      : '', // todo
        dialogTitle: '' // todo
    };
    return _.extend({}, paginationTranslation, filtersTranslation, translation);
});
