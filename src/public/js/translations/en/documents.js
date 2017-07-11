var _ = require('underscore');
var paginationTranslation = require('./pagination');
var filtersTranslation = require('./filters');

var documentsTranslation = {
    // top bar
    all        : 'Documents',
    archive    : 'Archive',
    newDocument: 'New Document',
    selectAll  : 'Select all',
    action     : 'Action',
    disable    : 'Disable',
    unDisable  : 'Enable',
    delete : 'Delete',
    copyButton : 'Copy',
    cutButton : 'Cut',
    pasteButton : 'Paste',
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

module.exports = _.extend({}, paginationTranslation, filtersTranslation, documentsTranslation);
