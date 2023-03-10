var _ = require('underscore');
var paginationTranslation = require('./pagination');
var filtersTranslation = require('./filters');
var cropImagesTranslation = require('./cropImages');
var personnelTranslation = require('./personnel');
var visibilityForm = require('./visibilityForm');

var translation = {
    crop             : cropImagesTranslation,
    assignToPersonnel: personnelTranslation,
    // top bar
    objectives       : 'Objectives',
    allObjectives    : 'All Objectives',
    assignedToMe     : 'Assigned to me',
    createdByMe      : 'Created by me',
    myCoverObjectives: 'My cover Objectives',
    closed           : 'Closed',
    myCCObjectives   : 'My CC objectives',
    newObjective     : 'New Objective',
    // list
    priority         : 'Priority',
    endDate          : 'Due date',
    progress         : 'Progress',
    location         : 'Location',
    coveringFor      : 'Covering for',

    // create
    titleCreate    : 'Create Objective',
    title          : 'Title',
    type           : 'Type',
    assignTo       : 'Assign To',
    status         : 'Status',
    draft          : 'Draft',
    startDate      : 'Start Date',
    description    : 'Description',
    attachments    : 'Attachments',
    action         : 'Action',
    attachFiles    : 'Attach Files',
    linkForm       : 'Link Form',
    unlinkForm     : 'Unlink Form',
    files          : 'Files',
    commentText    : 'Comment Text',
    reAssign       : 'Re-assign',
    selectPersonnel: 'Select personnel',

    // edit
    titleEdit     : 'Edit Objective',
    titleDuplicate: 'Duplicate Objective',

    // distribution
    titleDistribution: 'Distribution Form',
    product          : 'Product',
    variant          : 'Variant',
    item             : 'Item',
    packing          : 'Weight',

    // link form template
    formType: ' Form Type',

    // preview
    titleObjective: 'View Objective',
    main          : 'Main',
    objectivesTree: 'Objectives Tree',
    okBtn         : 'Ok',
    creationDate  : 'Creation Date',

    // subObjectives
    titleAssign     : 'Assign Objective',
    titleCreateSub  : 'Create Sub Objective',
    companyObjective: 'Company Objective',
    countryObjective: 'Country Objective',
    dontShowCompany : "Don't show company objective in sub-objectives",
    dontShowCountry : "Don't show country objective in sub-objectives",

    // updatePreview
    assignBy: 'Assign By',
    attach  : 'Attach',
    send    : 'Send',

    // assignBtn
    areaMan  : 'Area in charge Manager',
    salesMan : 'Salesman, Merchandiser, Cash van',
    duplicate: 'Duplicate',
    edit     : 'Edit',
    assign   : 'Assign',

    // subObjective
    titleSubObjective    : 'Sub-objectives',
    createSubObjective   : 'Create sub-objective',
    viewSubObjective     : 'View sub-objectives',
    titleSubObjectiveView: 'Sub-objectives',

    // form
    forms: 'Forms',
    form : 'form',
    before: 'Before',

    // effort
    effort  : 'Effort',
    employee: 'Employee',

    saveBtn       : 'Save',
    sendBtn       : 'Send',
    goToBtn       : 'Go to',
    addTranslation: {
        en: 'Add arabic translation',
        ar: 'Add english translation'
    },

    dialogTitle: 'Objectives files',
    applyToAll: 'Apply to all',
    countOfAttachedFiles: 'Count of attached files'
};

module.exports = _.extend({}, paginationTranslation, filtersTranslation, translation, visibilityForm);
