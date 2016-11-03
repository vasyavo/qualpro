define([
    'Underscore',
    'translations/en/pagination',
    'translations/en/filters'
], function (_, paginationTranslation, filtersTranslation) {
    'use strict';

    var notesTranslation = {
        // top bar
        all      : 'Notes',
        archive  : 'Archive',
        newNote  : 'New Note',
        selectAll: 'Select all',
        action   : 'Action',
        disable  : 'Disable',
        unDisable: 'Un Disable',
        // list

        // create
        createTitle: 'Create Note',
        titleOnly  : 'Title for your new note',
        theme      : 'Subject',
        createBtn  : 'Create',
        cancelBtn  : 'Cancel',

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

    return _.extend({}, paginationTranslation, filtersTranslation, notesTranslation);
});