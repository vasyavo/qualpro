var _ = require('underscore');
var paginationTranslation = require('./pagination');
var filtersTranslation = require('./filters');
var cropImagesTranslation = require('./cropImages');

var regionTranslation = {
    crop           : cropImagesTranslation,
    // top bar
    all            : 'Region',
    archive        : 'Archive',
    firstBreadCrumb: 'Countries',
    newDomain      : 'New Region',
    selectAll      : 'Select All',
    okBtn          : 'Ok',

    // list
    flag          : 'Flag',
    name          : 'Name',
    createdBy     : 'Created By',
    // create
    createTitle   : 'Create Region',
    labelName     : 'Region Name',
    addImage      : 'Add image',
    addTranslation: {
        en: 'Add arabic translation',
        ar: 'Add english translation'
    },

    createBtn   : 'Create',
    cancelBtn   : 'Cancel',
    // edit
    editTitle   : 'Edit Region',
    changeImage : 'Change image',
    saveBtn     : 'Save',
    // preview
    previewTitle: 'View Region',
    domainName  : 'Region'
};

module.exports = _.extend({}, paginationTranslation, filtersTranslation, regionTranslation);
