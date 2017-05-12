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
        titleQuestionary : 'Consumer Survey',
        aboutSKUFormat   : 'About SKU format',
        addNewBtn        : 'Add new Item',
        deleteBtn        : 'Delete Item',
        questions        : 'Surveys',
        type             : 'Type',
        options          : 'Options',
        createQuestionary: 'Create Consumer Survey',

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
        startDate         : 'Start Date',
        create            : 'Create',
        questionType      : 'Consumer Survey Type',
        //preview
        titlePreview      : 'New Consumer Survey',
        respondents       : 'Respondents',
        duplicateBtn      : 'Duplicate',
        editBtn           : 'Edit',
        respondent        : 'Respondent',
        answer            : 'Answer',
        saveBtn           : 'Save',
        sendBtn           : 'Send',
        goToBtn           : 'Go to',
        questionaryPreview: 'Consumer Survey Preview',
        okBtn             : 'Ok',

        //edit answer
        editAnswerViewTitle: 'Edit answer of question',

        // top Bar
        all   : 'al alali Consumer Survey',
        newBtn: 'New Consumer Survey',
        of    : 'of'
    };
    return _.extend({}, paginationTranslation, filtersTranslation, translation);
});
