var _ = require('underscore');
var paginationTranslation = require('./pagination');
var filtersTranslation = require('./filters');

var translation = {
    competitorPromotionEditTitle : 'Edit competitor promotion activities',
    all         : 'Competitor promotion activities',
    title       : 'Competitors promo evaluation report',
    category    : 'Category',
    brand       : 'Brand',
    origin      : 'Origin',
    promotion   : 'Promotion',
    rsp         : 'RSP',
    packing     : 'Weight',
    expiry      : 'Expiry',
    employee    : 'Employee',
    country     : 'Country',
    region      : 'Region',
    subRegion   : 'Sub-Region',
    tradeChannel: 'Trade Channel',
    outlet      : 'Customer',
    branch      : 'Branch',
    displayType : 'Display Type',
    startDate   : 'Start Date',
    endDate     : 'End Date',
    description : 'Description',
    attachments : 'Attachments',
    files       : 'Files',
    attach      : 'Attach',
    send        : 'Send',
    saveBtn : 'Save',
    location    : 'Location',
    commentText : 'Comment Text',
    okBtn       : 'Ok',
    edit        : 'Edit',
    delete: 'Delete',
    dialogTitle : 'Comment attachments',
    goToBtn : 'Go to',
    weight : 'Weight',
};

module.exports = _.extend({}, paginationTranslation, filtersTranslation, translation);

