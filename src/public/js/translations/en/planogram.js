define([
    'Underscore',
    'translations/en/pagination',
    'translations/en/filters'
], function (_, paginationTranslation, filtersTranslation) {
    var translation = {
        all                 : 'Planograms',
        archive             : 'Archive',
        manageConfigurations: 'Manage Configurations',
        manageConfiguration : 'Manage Configuration',
        newPlanogram        : 'New Planogram',
        selectAll           : 'Select all',
        action              : 'Action',
        disable             : 'Disable',
        unDisable           : 'Un Disable',
        saveBtn             : 'Save',
        cancelBtn           : 'Cancel',
        okBtn               : 'Ok',
        goToBtn             : 'Go to',
        editBtn             : 'Edit',
        displayType         : 'Display Type',

        // list
        created: 'Created',
        edited : 'Edited',
        by     : 'By',

        // create
        createPlanogram: 'Create Planogram',
        addPhoto       : 'Add Photo',

        // edit
        editPlanogram : 'Edit Planogram',
        changePhoto   : 'Change Photo',
        country       : 'Country',
        retailSegment : 'Trade Channel',
        product       : 'Product',
        configuration : 'Configuration',
        configurations: 'Configurations',

        // preview
        viewPlanogram   : 'View Planogram',
        photo           : 'Photo',
        previewPlanogram: 'Preview Planogram'

    };
    return _.extend({}, paginationTranslation, filtersTranslation, translation);
});
