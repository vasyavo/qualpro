var _ = require('underscore');
var paginationTranslation = require('./pagination');
var filtersTranslation = require('./filters');

var translation = {
    // top bar
    notifications        : 'Notifications',
    newNotification      : 'New Notification',
    // list
    location             : 'Location',
    // create
    attachments          : 'Attachments',
    attachFiles          : 'Attach Files',
    attachmentsDialogTitle : 'Notification Files',
    attach               : 'Attach',
    createNotification   : 'Create Notification',
    cancelBtn            : 'Cancel',
    description          : 'Description',
    sendBtn              : 'Send',
    inputCountryName     : 'Input country name',
    inputRegionName      : 'Input region name',
    inputSubRegionName   : 'Input sub-region name',
    inputTradeChannelName: 'Input trade channel name',
    inputOutletName      : 'Input customer name',
    inputBranchName      : 'Input branch name',
    inputPositionName    : 'Input position name',
    inputEmployeeName    : 'Input employee name',
    // preview
    viewNotification     : 'View Notification',
    country              : 'Country',
    region               : 'Region',
    subRegion            : 'Sub-Region',
    tradeChannel         : 'Trade channel',
    outlet               : 'Customer',
    branch               : 'Branch',
    position             : 'Position',
    employee             : 'Employee',
    date                 : 'Date',
    okBtn                : 'Ok',
    goToBtn              : 'Go to',
    addTranslation       : {
        en: 'Add arabic translation',
        ar: 'Add english translation'
    },
    type: 'Type',
};

module.exports = _.extend({}, paginationTranslation, filtersTranslation, translation);
