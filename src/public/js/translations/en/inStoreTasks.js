var _ = require('underscore');
var paginationTranslation = require('./pagination');
var filtersTranslation = require('./filters');
var personnelTranslation = require('./personnel');
var visibilityForm = require('./visibilityForm');

var translation = {
    assignToPersonnel: personnelTranslation,

    // btn
    okBtn      : 'Ok',
    saveBtn    : 'Save',
    sendBtn    : 'Send',
    cancelBtn  : 'Cancel',
    action     : 'Action',
    attachFiles: 'Attach files',
    assign     : 'Assign',
    attach     : 'Attach',
    reAssign   : 'Re-assign',

    // everything else
    all               : 'In-store Reporting',
    allTasks          : 'All Tasks',
    assignedToMe      : 'Assigned to me',
    createdByMe       : 'Created by me',
    myCoverTasks      : 'My Cover Tasks',
    closed            : 'Closed',
    myCCTasks         : 'My CC tasks',
    newTask           : 'New Task',
    priority          : 'Priority',
    location          : 'Location',
    endDate           : 'End date',
    status            : 'Status',
    createTask        : 'Create Task',
    title             : 'Title',
    assignTo          : 'Assign To',
    assignBy          : 'Assign By',
    selectPersonnel   : 'Select personnel',
    draft             : 'Draft',
    startDate         : 'Start Date',
    dueDate           : 'Due Date',
    description       : 'Description',
    attachments       : 'Attachments',
    linkForm          : 'Link form',
    files             : 'Files',
    taskPreview       : 'Task Preview',
    main              : 'Main',
    taskFlow          : 'Task flow',
    type              : 'Type',
    createNewObjective: 'Create New Objective',
    commentText       : 'Comment Text',
    coveringFor       : 'Covering for',
    creationDate      : 'Creation Date',

    // edit
    duplicateInStore: 'Duplicate In-store Reporting',
    editInStore     : 'Edit In-store Reporting',
    noTranslation   : 'No Translation',
    edit            : 'Edit',
    duplicate       : 'Duplicate',

    // form
    form       : 'Forms',
    goToBtn    : 'Go to',
    dialogTitle: 'InStore-Reporting files',
    countOfAttachedFiles: 'Count of attached files'
};

module.exports = _.extend({}, paginationTranslation, filtersTranslation, translation, visibilityForm);
