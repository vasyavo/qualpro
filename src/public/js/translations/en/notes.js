var _ = require('underscore');
var paginationTranslation = require('./pagination');
var filtersTranslation = require('./filters');

var notesTranslation = {
    // top bar
    all      : 'Notes',
    archive  : 'Archive',
    newNote  : 'New Note',
    selectAll: 'Select all',
    action   : 'Action',
    disable  : 'Disable',
    unDisable: 'Enable',
    // list

    // create
    createTitle: 'Create Note',
    titleOnly  : 'Title for your new note',
    theme      : 'Subject',
    createBtn  : 'Create',
    cancelBtn  : 'Cancel',
    attach     : 'Attach',
    attachmentsDialogTitle : 'Note Files',
    attachments : 'Attachments',
    attachFiles : 'Attach Files',

    // edit
    editTitle   : 'Edit Note',
    saveBtn     : 'Save',
    // preview
    okBtn       : 'Ok',
    preViewTitle: 'View Note',
    description : 'Description',
    title       : 'Title',
    goToBtn     : 'Go to'
};

module.exports = _.extend({}, paginationTranslation, filtersTranslation, notesTranslation);