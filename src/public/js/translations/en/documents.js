define([
    'Underscore',
    'translations/en/pagination',
    'translations/en/filters'
], function (_, paginationTranslation, filtersTranslation) {
    'use strict';

    var documentsTranslation = {
        // top bar
        all        : 'Documents',
        archive    : 'Archive',
        newDocument: 'New Document',
        selectAll  : 'Select all',
        action     : 'Action',
        disable    : 'Disable',
        unDisable  : 'Un Disable',
        // list

        // create
        createTitle : 'Create Document',
        createFolderTitle : 'Create Folder',
        titleInput  : 'Input title',
        title       : 'Title',
        createBtn   : 'Create',
        cancelBtn   : 'Cancel',
        attachments : 'Attachment',
        attachFiles : 'Attach File',
        // edit
        editTitle   : 'Edit Document',
        saveBtn     : 'Save',
        // preview
        okBtn       : 'Ok',
        preViewTitle: 'View Document',
        goToBtn     : 'Go to',
        attach      : 'Attach',
        documentFile: 'Document Files'
    };

    return _.extend({}, paginationTranslation, filtersTranslation, documentsTranslation);
});