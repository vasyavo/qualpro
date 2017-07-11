var _ = require('underscore');
var paginationTranslation = require('./pagination');
var filtersTranslation = require('./filters');

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
    delete: '', // todo

    // edit
    saveBtn: '', // todo
    brandingAndMonthlyDisplayEditTitle: '', // todo

    // topBar
    all        : '', // todo
    okBtn      : '', // todo
    dialogTitle: '' // todo
};

module.exports = _.extend({}, paginationTranslation, filtersTranslation, translation);
