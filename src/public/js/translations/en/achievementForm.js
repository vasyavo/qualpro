var _ = require('underscore');
var paginationTranslation = require('./pagination');
var filtersTranslation = require('./filters');

var achievementFormTranslation = {
    // list
    description  : 'Description',
    comment      : 'Comment',
    location     : 'Location',
    date         : 'Date',
    startDate   : 'Start Date',
    endDate     : 'End Date',
    // preview
    title        : 'Achievement form view',
    saveBtn      : 'Ok',
    employeeName : 'Employee name',
    country      : 'Country',
    region       : 'Region',
    subRegion    : 'Sub-Region',
    retailSegment: 'Trade channel',
    outlet       : 'Customer',
    branch       : 'Branch',
    attachments  : 'Attachments',
    noTranslation: 'No translation',
    files        : 'Files',
    all          : 'Achievement form',
    goToBtn : 'Go to',
    edit : 'Edit',
    delete: 'Delete',
    additionalComment: 'Additional Comment',
    achievementFormEditTitle: 'Edit Achievement Form',
    dialogTitle : 'Comment attachments',
    attach      : 'Attach',
    send        : 'Send',
    okBtn       : 'Ok',
};

module.exports = _.extend({}, paginationTranslation, filtersTranslation, achievementFormTranslation);
