var _ = require('underscore');
var paginationTranslation = require('./pagination');
var filtersTranslation = require('./filters');

var branchTranslation = {
    // top bar
    all            : 'Branch',
    archive        : 'Archive',
    firstBreadCrumb: 'Countries',
    newDomain      : 'New Branch',
    selectAll      : 'Select all',
    okBtn          : 'Ok',

    // list
    flag          : 'Flag',
    name          : 'Name',
    createdBy     : 'Created By',
    // create
    createTitle   : 'Create Branch',
    labelName     : 'Branch Name',
    retailSegment : 'Trade channel',
    outlet        : 'Customer',
    address       : 'Address',
    labelMap      : 'Link to map',
    labelManager  : 'Branch Manager',
    labelMobile   : 'Mobile',
    labelEmail    : 'Email',
    addImage      : 'Add image',
    addTranslation: {
        en: 'Add arabic translation',
        ar: 'Add english translation'
    },

    createBtn      : 'Create',
    cancelBtn      : 'Cancel',
    retailSegmentPH: 'Input Trade channel name',
    outletPH       : 'Input Customer name',
    managerPH      : 'Input manager name',
    // edit
    editTitle      : 'Edit Branch',
    changeImage    : 'Change image',
    saveBtn        : 'Save',
    // preview
    previewTitle   : 'View Branch',
    domainName     : 'Branch'
};

module.exports = _.extend({}, paginationTranslation, filtersTranslation, branchTranslation);
