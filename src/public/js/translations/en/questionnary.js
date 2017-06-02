define([
    'Underscore',
    'translations/en/pagination',
    'translations/en/filters'
], function (_, paginationTranslation, filtersTranslation) {
    var translation = {
        // list
        location: 'Location',
        endDate : 'Due date',

        // create
        titleQuestionary : 'Questionnaire',
        aboutSKUFormat   : 'About SKU format',
        addNewBtn        : 'Add new Item',
        deleteBtn        : 'Delete Item',
        delete: 'Delete',
        questions        : 'Questions',
        type             : 'Type',
        options          : 'Options',
        createQuestionary: 'Create Questionnaire',

        //create Question
        enterQuestion     : {
            en: 'Enter Question in English',
            ar: 'Enter Question in Arabic'
        },
        enterTitle     : {
            en: 'Enter Title in English',
            ar: 'Enter Title in Arabic'
        },
        enterOption     : {
            en: 'Enter Option to choose in English',
            ar: 'Enter Option to choose in Arabic'
        },
        title             : 'Title',
        dueDate           : 'Due date',
        create            : 'Create',
        questionType      : 'Question Type',
        //preview
        titlePreview      : 'New Questionnaire',
        respondents       : 'Respondents',
        duplicateBtn      : 'Duplicate',
        editBtn           : 'Edit',
        respondent        : 'Respondent',
        answer            : 'Answer',
        saveBtn           : 'Save',
        sendBtn           : 'Send',
        goToBtn           : 'Go to',
        questionaryPreview: 'Questionnaire Preview',
        okBtn             : 'Ok',

        //edit answer
        editAnswerViewTitle: 'Edit answer of question',

        // top Bar
        all   : 'al alali Questionnaire',
        newBtn: 'New Questionnaire',
        of    : 'of'
    };
    return _.extend({}, paginationTranslation, filtersTranslation, translation);
});
