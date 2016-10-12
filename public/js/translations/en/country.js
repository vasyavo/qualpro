define([
    'Underscore',
    'translations/en/pagination',
    'translations/en/cropImages',
    'translations/en/filters'
], function (_, paginationTranslation, cropImagesTranslation, filtersTranslation) {
    var countryTranslation = {
        crop           : cropImagesTranslation,
        // top bar
        all            : 'Countries',
        archive        : 'Archive',
        firstBreadCrumb: 'Countries',
        newDomain      : 'New Country',
        selectAll      : 'Select all',
        okBtn          : 'Ok',
        // list
        flag           : 'Flag',
        name           : 'Name',
        createdBy      : 'Created By',
        // create
        createTitle    : 'Create Country',
        labelName      : 'Country Name',
        labelCurrency  : 'Currency',
        addImage       : 'Add image',
        addTranslation : {
            en: 'Add arabic translation',
            ar: 'Add english translation'
        },

        createBtn   : 'Create',
        cancelBtn   : 'Cancel',
        currencyPH  : 'Input currency name',
        // edit
        editTitle   : 'Edit Country',
        changeImage : 'Change image',
        saveBtn     : 'Save',
        // preview
        previewTitle: 'View Country',
        domainName  : 'Country'
    };
    return _.extend({}, paginationTranslation, filtersTranslation, countryTranslation);
});
