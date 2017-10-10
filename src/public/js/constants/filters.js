var CONSTANTS = require('./contentType');

function getConstants(CONSTANTS) {
    var filters = {};

    var brandingAndMonthlyDisplayFilter = {};
    var marketingCampaignFilter = {};
    var priceSurveyFilter = {};
    var personnelFilter = {};
    var shelfSharesFilter = {};
    var createQuestionnary = {};
    var createConsumersSurvey = {};
    var itemsPricesFilter = {};
    var itemsLocationFilter = {};
    var planogramFilter = {};
    var competitorsFilter = {};
    var notificationsFilter = {};
    var objectivesFilter = {};
    var inStoreTaskFilter = {};
    var achievementFormFilter = {};
    var newProductLaunchFilter = {};
    var competitorBrandingFilter = {};
    var contactUsFilter = {};
    var competitorPromotionFilter = {};
    var promotionFilter = {};
    var personnelTasksFilter = {};
    var domainsFilter = {};
    var questionnaryFilter = {};
    var consumersSurveyFilter = {};
    var activityListFilter = {};
    var contractsYearlyFilter = {};
    var contractsSecondaryFilter = {};
    var documentsFilter = {};
    var notesFilter = {};

    var translatedCollection = [
        {
            _id : 'true',
            name: {
                en: 'Translated',
                ar: 'حسب الترجمة'
            }
        },
        {
            _id : 'false',
            name: {
                en: 'Not Translated',
                ar: 'غير المترجمة'
            }

        }
    ];

    var ratedCollection = [
        {
            _id : 'true',
            name: {
                en: 'Rated',
                ar: 'حسب التقييم'
            }
        },
        {
            _id : 'false',
            name: {
                en: 'Not Rated',
                ar: 'لم تقيم'
            }
        }
    ];

    var timeCollection = [
        {
            _id : 'lastMonth',
            name: {
                en: 'Last Month',
                ar: 'الشهر الماضي'
            }
        },
        {
            _id : 'lastWeek',
            name: {
                en: 'Last Week',
                ar: 'الاسبوع الماضى'
            }
        },
        {
            _id : 'thisYear',
            name: {
                en: 'This Year',
                ar: 'هذا العام'
            }
        },
        {
            _id : 'thisMonth',
            name: {
                en: 'This Month',
                ar: 'لشهر الحالى'
            }
        },
        {
            _id : 'thisWeek',
            name: {
                en: 'This Week',
                ar: 'هذا الشهر'
            }
        },
        {
            _id : 'fixedPeriod',
            name: {
                en: 'Fixed Period',
                ar: 'فترة محددة'
            }
        }
    ];


    function getFilterConstant(options) {
        var resultObject = {};

        var displayName = options.displayName;
        var type = options.type || 'ObjectId';
        var parent = options.parent || 'multiSelect';
        var filterType = options.filterType || null;
        var mandatory = options.mandatory || false;
        var singleSelect = options.singleSelect || false;
        var showSelectAll = options.showSelectAll || false;

        resultObject.type = type;
        resultObject.mandatory = mandatory;
        resultObject.singleSelect = singleSelect;
        resultObject.parent = parent;
        resultObject.filterType = filterType;

        if (resultObject.filterType == 'multiSelect' && showSelectAll) {
            resultObject.showSelectAll = showSelectAll;
        }

        if (displayName) {
            resultObject.displayName = displayName;
        }

        return resultObject;
    }

    // filter types ['singleSelect', 'multiSelect', 'translated', 'time']

    marketingCampaignFilter[CONSTANTS.COUNTRY] = getFilterConstant({
        mandatory  : true,
        filterType : 'multiSelect',
        displayName: {
            en: 'Country',
            ar: 'الدولة'
        }
    });
    marketingCampaignFilter[CONSTANTS.CATEGORY] = getFilterConstant({
        mandatory  : true,
        filterType : 'multiSelect',
        displayName: {
            en: 'Category',
            ar: 'الفئة'
        }
    });
    marketingCampaignFilter[CONSTANTS.REGION] = getFilterConstant({
        parent     : 'country',
        filterType : 'multiSelect',
        displayName: {
            en: 'Region',
            ar: 'المنطقة'
        }
    });
    marketingCampaignFilter[CONSTANTS.SUBREGION] = getFilterConstant({
        parent     : 'region',
        filterType : 'multiSelect',
        displayName: {
            en: 'Sub-Region',
            ar: 'المنطقة الفرعية:'
        }
    });
    marketingCampaignFilter[CONSTANTS.RETAILSEGMENT] = getFilterConstant({
        filterType : 'multiSelect',
        displayName: {
            en: 'Trade Channel',
            ar: 'الفئة التجارية:'
        }
    });
    marketingCampaignFilter[CONSTANTS.OUTLET] = getFilterConstant({
        filterType : 'multiSelect',
        displayName: {
            en: 'Customer',
            ar: 'العميل'
        }
    });
    marketingCampaignFilter[CONSTANTS.BRANCH] = getFilterConstant({
        filterType : 'multiSelect',
        displayName: {
            en: 'Branch',
            ar: 'الفرع'
        }
    });
    marketingCampaignFilter.publisher = getFilterConstant({
        filterType : 'multiSelect',
        displayName: {
            en: 'Publisher',
            ar: 'الناشر'
        }
    });
    marketingCampaignFilter[CONSTANTS.POSITION] = getFilterConstant({
        filterType : 'multiSelect',
        displayName: {
            en: 'Position',
            ar: 'المركز الوظيفي'
        }
    });
    marketingCampaignFilter[CONSTANTS.PERSONNEL] = getFilterConstant({
        filterType : 'multiSelect',
        displayName: {
            en: 'Employee',
            ar: 'الموظف'
        }
    });
    marketingCampaignFilter[CONSTANTS.STATUS] = getFilterConstant({
        type       : 'string',
        filterType : 'multiSelect',
        displayName: {
            en: 'Status',
            ar: 'الحالة'
        }
    });
    marketingCampaignFilter.time = getFilterConstant({
        displayName: {en: 'Time', ar: 'الوقت'},
        type       : 'date',
        filterType : 'time'
    });
    marketingCampaignFilter.time.backendKeys = [
        {
            key     : 'createdBy.date',
            operator: ['$gte', '$lte']
        },
        {
            key     : 'editedBy.date',
            operator: ['$gte', '$lte']
        }
    ];
    marketingCampaignFilter.array = [
        CONSTANTS.COUNTRY,
        CONSTANTS.CATEGORY,
        CONSTANTS.REGION,
        CONSTANTS.SUBREGION,
        CONSTANTS.RETAILSEGMENT,
        CONSTANTS.OUTLET,
        CONSTANTS.BRANCH,
        'publisher',
        CONSTANTS.POSITION,
        CONSTANTS.PERSONNEL,
        CONSTANTS.STATUS,
        'time'
    ];

    documentsFilter.time = getFilterConstant({
        displayName: {en: 'Time', ar: 'الوقت'},
        type       : 'date',
        filterType : 'time'
    });
    documentsFilter.time.backendKeys = [
        {
            key     : 'createdBy.date',
            operator: ['$gte', '$lte']
        },
        {
            key     : 'editedBy.date',
            operator: ['$gte', '$lte']
        }
    ];
    documentsFilter.array = [
        'time'
    ];

    // notesFilter['time'] = getFilterConstant({displayName: {en:'Time', ar: 'الوقت'}, type: 'string', filterType: 'time'});
    notesFilter.array = [];

    shelfSharesFilter[CONSTANTS.CATEGORY] = getFilterConstant({
        displayName: {en: 'Category', ar: 'الفئة'},
        mandatory  : true,
        filterType : 'multiSelect'
    });
    shelfSharesFilter[CONSTANTS.BRAND] = getFilterConstant({
        displayName: {en: 'Brand', ar: 'العلالي'},
        filterType : 'multiSelect'
    });
    shelfSharesFilter[CONSTANTS.COUNTRY] = getFilterConstant({
        displayName: {en: 'Country', ar: 'الدولة'},
        filterType : 'singleSelect'
    });
    shelfSharesFilter[CONSTANTS.REGION] = getFilterConstant({
        displayName: {en: 'Region', ar: 'المنطقة'},
        filterType : 'multiSelect'
    });
    shelfSharesFilter[CONSTANTS.SUBREGION] = getFilterConstant({
        displayName: {en: 'Sub-Region', ar: 'المنطقة الفرعية:'},
        filterType : 'multiSelect'
    });
    shelfSharesFilter[CONSTANTS.RETAILSEGMENT] = getFilterConstant({
        displayName: {en: 'Trade Channel', ar: 'الفئة التجارية:'},
        filterType : 'multiSelect'
    });
    shelfSharesFilter[CONSTANTS.OUTLET] = getFilterConstant({
        displayName: {en: 'Customer', ar: 'العميل'},
        filterType : 'multiSelect'
    });
    shelfSharesFilter[CONSTANTS.BRANCH] = getFilterConstant({
        displayName: {en: 'Branch', ar: 'الفرع'},
        filterType : 'multiSelect'
    });
    shelfSharesFilter[CONSTANTS.POSITION] = getFilterConstant({
        displayName: {en: 'Position', ar: 'المركز الوظيفي'},
        filterType : 'multiSelect'
    });
    shelfSharesFilter[CONSTANTS.PERSONNEL] = getFilterConstant({
        displayName: {en: 'Employee', ar: 'الموظف'},
        filterType : 'multiSelect'
    });
    shelfSharesFilter.time = getFilterConstant({
        displayName: {en: 'Time', ar: 'الوقت'},
        type       : 'date',
        filterType : 'time'
    });
    shelfSharesFilter.time.backendKeys = [
        {
            key     : 'createdBy.date',
            operator: ['$gte', '$lte']
        },
        {
            key     : 'editedBy.date',
            operator: ['$gte', '$lte']
        }
    ];
    shelfSharesFilter.array = [
        CONSTANTS.CATEGORY,
        CONSTANTS.BRAND,
        CONSTANTS.COUNTRY,
        CONSTANTS.REGION,
        CONSTANTS.SUBREGION,
        CONSTANTS.RETAILSEGMENT,
        CONSTANTS.OUTLET,
        CONSTANTS.BRANCH,
        CONSTANTS.POSITION,
        CONSTANTS.PERSONNEL,
        'time'
    ];

    priceSurveyFilter[CONSTANTS.CATEGORY] = getFilterConstant({
        displayName: {en: 'Category', ar: 'الفئة'},
        mandatory  : true,
        filterType : 'multiSelect'
    });
    priceSurveyFilter[CONSTANTS.COUNTRY] = getFilterConstant({
        displayName: {en: 'Country', ar: 'الدولة'},
        mandatory  : true,
        filterType : 'singleSelect'
    });
    priceSurveyFilter[CONSTANTS.REGION] = getFilterConstant({
        displayName: {en: 'Region', ar: 'المنطقة'},
        filterType : 'multiSelect'
    });
    priceSurveyFilter[CONSTANTS.SUBREGION] = getFilterConstant({
        displayName: {en: 'Sub-Region', ar: 'المنطقة الفرعية:'},
        filterType : 'multiSelect'
    });
    priceSurveyFilter[CONSTANTS.RETAILSEGMENT] = getFilterConstant({
        displayName: {en: 'Trade Channel', ar: 'الفئة التجارية:'},
        filterType : 'multiSelect'
    });
    priceSurveyFilter[CONSTANTS.OUTLET] = getFilterConstant({
        displayName: {en: 'Customer', ar: 'العميل'},
        filterType : 'multiSelect'
    });
    priceSurveyFilter[CONSTANTS.BRANCH] = getFilterConstant({
        displayName: {en: 'Branch', ar: 'الفرع'},
        filterType : 'multiSelect'
    });
    priceSurveyFilter[CONSTANTS.POSITION] = getFilterConstant({
        displayName: {en: 'Position', ar: 'المركز الوظيفي'},
        filterType : 'multiSelect'
    });
    priceSurveyFilter[CONSTANTS.PERSONNEL] = getFilterConstant({
        displayName: {en: 'Employee', ar: 'الموظف'},
        filterType : 'multiSelect'
    });
    priceSurveyFilter.time = getFilterConstant({
        displayName: {en: 'Time', ar: 'الوقت'},
        type       : 'date',
        filterType : 'time'
    });
    priceSurveyFilter.time.backendKeys = [
        {
            key     : 'createdBy.date',
            operator: ['$gte', '$lte']
        }
    ];
    priceSurveyFilter.array = [
        CONSTANTS.CATEGORY,
        CONSTANTS.COUNTRY,
        CONSTANTS.REGION,
        CONSTANTS.SUBREGION,
        CONSTANTS.RETAILSEGMENT,
        CONSTANTS.OUTLET,
        CONSTANTS.BRANCH,
        CONSTANTS.POSITION,
        CONSTANTS.PERSONNEL,
        'time'
    ];

    personnelFilter[CONSTANTS.COUNTRY] = getFilterConstant({
        displayName: {en: 'Country', ar: 'الدولة'},
        mandatory  : true,
        filterType : 'singleSelect'
    });
    personnelFilter[CONSTANTS.REGION] = getFilterConstant({
        displayName: {en: 'Region', ar: 'المنطقة'},
        parent     : 'country',
        filterType : 'multiSelect'
    });
    personnelFilter[CONSTANTS.SUBREGION] = getFilterConstant({
        displayName: {en: 'Sub-Region', ar: 'المنطقة الفرعية:'},
        parent     : 'region',
        filterType : 'multiSelect'
    });
    personnelFilter[CONSTANTS.RETAILSEGMENT] = getFilterConstant({
        displayName: {en: 'Trade Channel', ar: 'الفئة التجارية:'},
        filterType : 'multiSelect'
    });
    personnelFilter[CONSTANTS.OUTLET] = getFilterConstant({
        displayName: {en: 'Customer', ar: 'العميل'},
        filterType : 'multiSelect'
    });
    personnelFilter[CONSTANTS.BRANCH] = getFilterConstant({
        displayName: {en: 'Branch', ar: 'الفرع'},
        filterType : 'multiSelect'
    });
    personnelFilter[CONSTANTS.POSITION] = getFilterConstant({
        displayName: {en: 'Position', ar: 'المركز الوظيفي'},
        filterType : 'multiSelect'
    });
    personnelFilter.status = getFilterConstant({
        displayName: {en: 'Status', ar: 'الحالة'},
        type       : 'string',
        filterType : 'multiSelect'
    });
    personnelFilter.lasMonthEvaluate = getFilterConstant({
        displayName: {en: 'Rated', ar: 'حسب التقييم'},
        type       : 'rate',
        filterType : 'singleSelect'
    });
    personnelFilter.translated = getFilterConstant({
        displayName: {en: 'Translated', ar: 'حسب الترجمة'},
        type       : 'boolean',
        filterType : 'translated'
    });
    personnelFilter.array = [
        CONSTANTS.COUNTRY,
        CONSTANTS.REGION,
        CONSTANTS.SUBREGION,
        CONSTANTS.RETAILSEGMENT,
        CONSTANTS.OUTLET,
        CONSTANTS.BRANCH,
        CONSTANTS.POSITION,
        'status',
        'translated',
        'lasMonthEvaluate'
    ];

    activityListFilter[CONSTANTS.COUNTRY] = getFilterConstant({
        displayName: {en: 'Country', ar: 'الدولة'},
        filterType : 'singleSelect',
        mandatory: true,
    });
    activityListFilter[CONSTANTS.REGION] = getFilterConstant({
        displayName: {en: 'Region', ar: 'المنطقة'},
        parent     : 'country',
        filterType : 'singleSelect',
    });
    activityListFilter[CONSTANTS.SUBREGION] = getFilterConstant({
        displayName: {en: 'Sub-Region', ar: 'المنطقة الفرعية:'},
        parent     : 'region',
        filterType : 'singleSelect',
    });
    // activityListFilter[CONSTANTS.RETAILSEGMENT] = getFilterConstant({displayName: 'Trade channel', filterType: 'singleSelect'});
    // activityListFilter[CONSTANTS.OUTLET] = getFilterConstant({displayName: 'Customer', filterType: 'singleSelect'});
    activityListFilter[CONSTANTS.BRANCH] = getFilterConstant({
        displayName: {en: 'Branch', ar: 'الفرع'},
        filterType : 'singleSelect'
    });
    activityListFilter[CONSTANTS.POSITION] = getFilterConstant({
        displayName: {en: 'Position', ar: 'المركز الوظيفي'},
        filterType : 'singleSelect'
    });
    //  activityListFilter['actionType'] = getFilterConstant({displayName: 'Type', filterType: 'singleSelect',type: 'string'});
    activityListFilter.module = getFilterConstant({
        displayName: {en: 'Type', ar: 'النوع'},
        filterType : 'singleSelect',
        type       : 'string'
    });
    activityListFilter.time = getFilterConstant({
        displayName: {en: 'Time', ar: 'الوقت'},
        type       : 'date',
        filterType : 'time'
    });
    activityListFilter.time.backendKeys = [
        {
            key     : 'createdBy.date',
            operator: ['$gte', '$lte']
        }
    ];

    activityListFilter.array = [
        CONSTANTS.COUNTRY,
        CONSTANTS.REGION,
        CONSTANTS.SUBREGION,
        //   CONSTANTS.RETAILSEGMENT,
        //  CONSTANTS.OUTLET,
        CONSTANTS.BRANCH,
        CONSTANTS.POSITION,
        'module',
        //     'actionType',
        'time'
    ];

    createQuestionnary[CONSTANTS.COUNTRY] = getFilterConstant({
        displayName: {en: 'Country', ar: 'الدولة'},
        mandatory  : true,
        filterType : 'singleSelect',
    });
    createQuestionnary[CONSTANTS.REGION] = getFilterConstant({
        displayName: {en: 'Region', ar: 'المنطقة'},
        filterType : 'multiSelect',
        showSelectAll : true
    });
    createQuestionnary[CONSTANTS.SUBREGION] = getFilterConstant({
        displayName: {en: 'Sub-Region', ar: 'المنطقة الفرعية:'},
        filterType : 'multiSelect',
        showSelectAll : true
    });
    createQuestionnary[CONSTANTS.RETAILSEGMENT] = getFilterConstant({
        displayName: {en: 'Trade Channel', ar: 'الفئة التجارية:'},
        filterType : 'multiSelect',
        showSelectAll : true
    });
    createQuestionnary[CONSTANTS.OUTLET] = getFilterConstant({
        displayName: {en: 'Customer', ar: 'العميل'},
        filterType : 'multiSelect',
        showSelectAll : true
    });
    createQuestionnary[CONSTANTS.BRANCH] = getFilterConstant({
        displayName: {en: 'Branch', ar: 'الفرع'},
        filterType : 'multiSelect',
        showSelectAll : true
    });
    createQuestionnary[CONSTANTS.POSITION] = getFilterConstant({
        displayName: {en: 'Position', ar: 'المركز الوظيفي'},
        filterType : 'multiSelect'
    });
    createQuestionnary[CONSTANTS.PERSONNEL] = getFilterConstant({
        displayName: {en: 'Employee', ar: 'الموظف'},
        filterType : 'multiSelect'
    });
    createQuestionnary.array = [
        CONSTANTS.COUNTRY,
        CONSTANTS.REGION,
        CONSTANTS.SUBREGION,
        CONSTANTS.RETAILSEGMENT,
        CONSTANTS.OUTLET,
        CONSTANTS.BRANCH,
        CONSTANTS.POSITION,
        CONSTANTS.PERSONNEL
    ];

    createConsumersSurvey[CONSTANTS.COUNTRY] = getFilterConstant({
        displayName: {en: 'Country', ar: 'الدولة'},
        mandatory  : true,
        filterType : 'singleSelect',
    });
    createConsumersSurvey[CONSTANTS.REGION] = getFilterConstant({
        displayName: {en: 'Region', ar: 'المنطقة'},
        filterType : 'multiSelect',
        showSelectAll : true
    });
    createConsumersSurvey[CONSTANTS.SUBREGION] = getFilterConstant({
        displayName: {en: 'Sub-Region', ar: 'المنطقة الفرعية:'},
        filterType : 'multiSelect',
        showSelectAll : true
    });
    createConsumersSurvey[CONSTANTS.RETAILSEGMENT] = getFilterConstant({
        displayName: {en: 'Trade Channel', ar: 'الفئة التجارية:'},
        filterType : 'multiSelect',
        showSelectAll : true
    });
    createConsumersSurvey[CONSTANTS.OUTLET] = getFilterConstant({
        displayName: {en: 'Customer', ar: 'العميل'},
        filterType : 'multiSelect',
        showSelectAll : true
    });
    createConsumersSurvey[CONSTANTS.BRANCH] = getFilterConstant({
        displayName: {en: 'Branch', ar: 'الفرع'},
        filterType : 'multiSelect',
        showSelectAll : true
    });
    createConsumersSurvey[CONSTANTS.POSITION] = getFilterConstant({
        displayName: {en: 'Position', ar: 'المركز الوظيفي'},
        filterType : 'multiSelect'
    });
    createConsumersSurvey[CONSTANTS.PERSONNEL] = getFilterConstant({
        displayName: {en: 'Employee', ar: 'الموظف'},
        filterType : 'multiSelect'
    });
    createConsumersSurvey.array = [
        CONSTANTS.COUNTRY,
        CONSTANTS.REGION,
        CONSTANTS.SUBREGION,
        CONSTANTS.RETAILSEGMENT,
        CONSTANTS.OUTLET,
        CONSTANTS.BRANCH,
        CONSTANTS.POSITION,
        CONSTANTS.PERSONNEL
    ];

    questionnaryFilter[CONSTANTS.COUNTRY] = getFilterConstant({
        displayName: {en: 'Country', ar: 'الدولة'},
        mandatory  : true,
        filterType : 'singleSelect'
    });
    questionnaryFilter[CONSTANTS.REGION] = getFilterConstant({
        displayName: {en: 'Region', ar: 'المنطقة'},
        filterType : 'multiSelect'
    });
    questionnaryFilter[CONSTANTS.SUBREGION] = getFilterConstant({
        displayName: {en: 'Sub-Region', ar: 'المنطقة الفرعية:'},
        filterType : 'multiSelect'
    });
    questionnaryFilter[CONSTANTS.RETAILSEGMENT] = getFilterConstant({
        displayName: {en: 'Trade Channel', ar: 'الفئة التجارية:'},
        filterType : 'multiSelect'
    });
    questionnaryFilter[CONSTANTS.OUTLET] = getFilterConstant({
        displayName: {en: 'Customer', ar: 'العميل'},
        filterType : 'multiSelect'
    });
    questionnaryFilter[CONSTANTS.BRANCH] = getFilterConstant({
        displayName: {en: 'Branch', ar: 'الفرع'},
        filterType : 'multiSelect'
    });
    questionnaryFilter.publisher = getFilterConstant({
        displayName: {en: 'Publisher', ar: 'الناشر'},
        filterType : 'multiSelect'
    });
    questionnaryFilter[CONSTANTS.POSITION] = getFilterConstant({
        displayName: {en: 'Position', ar: 'المركز الوظيفي'},
        filterType : 'multiSelect'
    });
    questionnaryFilter[CONSTANTS.PERSONNEL] = getFilterConstant({
        displayName: {en: 'Employee', ar: 'الموظف'},
        filterType : 'multiSelect'
    });
    questionnaryFilter[CONSTANTS.STATUS] = getFilterConstant({
        displayName: {en: 'Status', ar: 'الحالة'},
        type       : 'string',
        filterType : 'multiSelect'
    });
    questionnaryFilter.time = getFilterConstant({
        displayName: {en: 'Time', ar: 'الوقت'},
        filterType : 'time'
    });
    questionnaryFilter.time.backendKeys = [
        {
            key     : 'createdBy.date',
            operator: ['$gte', '$lte']
        },
        {
            key     : 'editedBy.date',
            operator: ['$gte', '$lte']
        }
    ];
    questionnaryFilter.array = [
        CONSTANTS.COUNTRY,
        CONSTANTS.REGION,
        CONSTANTS.SUBREGION,
        CONSTANTS.RETAILSEGMENT,
        CONSTANTS.OUTLET,
        CONSTANTS.BRANCH,
        'publisher',
        CONSTANTS.POSITION,
        CONSTANTS.PERSONNEL,
        CONSTANTS.STATUS,
        'time'
    ];

    consumersSurveyFilter[CONSTANTS.COUNTRY] = getFilterConstant({
        displayName: {en: 'Country', ar: 'الدولة'},
        mandatory  : true,
        filterType : 'singleSelect'
    });
    consumersSurveyFilter[CONSTANTS.REGION] = getFilterConstant({
        displayName: {en: 'Region', ar: 'المنطقة'},
        filterType : 'multiSelect'
    });
    consumersSurveyFilter[CONSTANTS.SUBREGION] = getFilterConstant({
        displayName: {en: 'Sub-Region', ar: 'المنطقة الفرعية:'},
        filterType : 'multiSelect'
    });
    consumersSurveyFilter[CONSTANTS.RETAILSEGMENT] = getFilterConstant({
        displayName: {en: 'Trade Channel', ar: 'الفئة التجارية:'},
        filterType : 'multiSelect'
    });
    consumersSurveyFilter[CONSTANTS.OUTLET] = getFilterConstant({
        displayName: {en: 'Customer', ar: 'العميل'},
        filterType : 'multiSelect'
    });
    consumersSurveyFilter[CONSTANTS.BRANCH] = getFilterConstant({
        displayName: {en: 'Branch', ar: 'الفرع'},
        filterType : 'multiSelect'
    });
    consumersSurveyFilter.publisher = getFilterConstant({
        displayName: {en: 'Publisher', ar: 'الناشر'},
        filterType : 'multiSelect'
    });
    consumersSurveyFilter[CONSTANTS.POSITION] = getFilterConstant({
        displayName: {en: 'Position', ar: 'المركز الوظيفي'},
        filterType : 'multiSelect'
    });
    consumersSurveyFilter[CONSTANTS.PERSONNEL] = getFilterConstant({
        displayName: {en: 'Employee', ar: 'الموظف'},
        filterType : 'multiSelect'
    });
    consumersSurveyFilter[CONSTANTS.STATUS] = getFilterConstant({
        displayName: {en: 'Status', ar: 'الحالة'},
        type       : 'string',
        filterType : 'multiSelect'
    });
    consumersSurveyFilter.time = getFilterConstant({
        displayName: {en: 'Time', ar: 'الوقت'},
        filterType : 'time'
    });
    consumersSurveyFilter.time.backendKeys = [
        {
            key     : 'createdBy.date',
            operator: ['$gte', '$lte']
        },
        {
            key     : 'editedBy.date',
            operator: ['$gte', '$lte']
        }
    ];
    consumersSurveyFilter.array = [
        CONSTANTS.COUNTRY,
        CONSTANTS.REGION,
        CONSTANTS.SUBREGION,
        CONSTANTS.RETAILSEGMENT,
        CONSTANTS.OUTLET,
        CONSTANTS.BRANCH,
        'publisher',
        CONSTANTS.POSITION,
        CONSTANTS.PERSONNEL,
        CONSTANTS.STATUS,
        'time'
    ];

    domainsFilter.translated = getFilterConstant({
        displayName: {en: 'Translated', ar: 'حسب الترجمة'},
        type       : 'boolean',
        filterType : 'translated'
    });
    domainsFilter.array = [
        'translated'
    ];

    notificationsFilter[CONSTANTS.COUNTRY] = getFilterConstant({
        displayName: {en: 'Country', ar: 'الدولة'},
        mandatory  : true,
        filterType : 'multiSelect'
    });
    notificationsFilter[CONSTANTS.REGION] = getFilterConstant({
        displayName: {en: 'Region', ar: 'المنطقة'},
        filterType : 'multiSelect'
    });
    notificationsFilter[CONSTANTS.SUBREGION] = getFilterConstant({
        displayName: {en: 'Sub-Region', ar: 'المنطقة الفرعية:'},
        filterType : 'multiSelect'
    });
    notificationsFilter[CONSTANTS.RETAILSEGMENT] = getFilterConstant({
        displayName: {en: 'Trade Channel', ar: 'الفئة التجارية:'},
        filterType : 'multiSelect'
    });
    notificationsFilter[CONSTANTS.OUTLET] = getFilterConstant({
        displayName: {en: 'Customer', ar: 'العميل'},
        filterType : 'multiSelect'
    });
    notificationsFilter[CONSTANTS.BRANCH] = getFilterConstant({
        displayName: {en: 'Branch', ar: 'الفرع'},
        filterType : 'multiSelect'
    });
    notificationsFilter[CONSTANTS.POSITION] = getFilterConstant({
        displayName: {en: 'Position', ar: 'المركز الوظيفي'},
        filterType : 'multiSelect'
    });
    notificationsFilter[CONSTANTS.PERSONNEL] = getFilterConstant({
        displayName: {en: 'Personnel', ar: 'شؤون الموظفين'},
        filterType : 'multiSelect'
    });
    notificationsFilter.translated = getFilterConstant({
        displayName: {en: 'Translated', ar: 'حسب الترجمة'},
        type       : 'boolean',
        filterType : 'translated'
    });
    notificationsFilter.time = getFilterConstant({
        displayName: {en: 'Time', ar: 'الوقت'},
        type       : 'date',
        filterType : 'time'
    });
    notificationsFilter.time.backendKeys = [
        {
            key     : 'createdBy.date',
            operator: ['$gte', '$lte']
        }
    ];
    notificationsFilter.array = [
        CONSTANTS.COUNTRY,
        CONSTANTS.REGION,
        CONSTANTS.SUBREGION,
        CONSTANTS.RETAILSEGMENT,
        CONSTANTS.OUTLET,
        CONSTANTS.BRANCH,
        CONSTANTS.POSITION,
        CONSTANTS.PERSONNEL,
        'translated',
        'time'
    ];

    objectivesFilter[CONSTANTS.COUNTRY] = getFilterConstant({
        displayName: {en: 'Country', ar: 'الدولة'},
        mandatory  : true,
        filterType : 'multiSelect'
    });
    objectivesFilter[CONSTANTS.REGION] = getFilterConstant({
        displayName: {en: 'Region', ar: 'المنطقة'},
        filterType : 'multiSelect'
    });
    objectivesFilter[CONSTANTS.SUBREGION] = getFilterConstant({
        displayName: {en: 'Sub-Region', ar: 'المنطقة الفرعية:'},
        filterType : 'multiSelect'
    });
    objectivesFilter[CONSTANTS.RETAILSEGMENT] = getFilterConstant({
        displayName: {en: 'Trade Channel', ar: 'الفئة التجارية:'},
        filterType : 'multiSelect'
    });
    objectivesFilter[CONSTANTS.OUTLET] = getFilterConstant({
        displayName: {en: 'Customer', ar: 'العميل'},
        filterType : 'multiSelect'
    });
    objectivesFilter[CONSTANTS.BRANCH] = getFilterConstant({
        displayName: {en: 'Branch', ar: 'الفرع'},
        filterType : 'multiSelect'
    });
    objectivesFilter[CONSTANTS.PRIORITY] = getFilterConstant({
        displayName: {en: 'Priority', ar: 'الأولوية'},
        type       : 'string',
        filterType : 'multiSelect'
    });
    objectivesFilter[CONSTANTS.OBJECTIVETYPE] = getFilterConstant({
        displayName: {en: 'Type', ar: 'النوع'},
        type       : 'string',
        filterType : 'multiSelect'
    });
    objectivesFilter[CONSTANTS.POSITION] = getFilterConstant({
        displayName: {en: 'Position', ar: 'المركز الوظيفي'},
        filterType : 'multiSelect'
    });
    objectivesFilter[CONSTANTS.STATUS] = getFilterConstant({
        displayName: {en: 'Status', ar: 'الحالة'},
        type       : 'string',
        filterType : 'multiSelect'
    });
    objectivesFilter.time = getFilterConstant({
        displayName: {en: 'Time', ar: 'الوقت'},
        type       : 'date',
        filterType : 'time'
    });
    objectivesFilter.time.backendKeys = [
        {
            key     : 'createdBy.date',
            operator: ['$gte', '$lte']
        },
        {
            key     : 'editedBy.date',
            operator: ['$gte', '$lte']
        }
    ];
    objectivesFilter.array = [
        CONSTANTS.COUNTRY,
        CONSTANTS.REGION,
        CONSTANTS.SUBREGION,
        CONSTANTS.RETAILSEGMENT,
        CONSTANTS.OUTLET,
        CONSTANTS.BRANCH,
        CONSTANTS.PRIORITY,
        CONSTANTS.OBJECTIVETYPE,
        CONSTANTS.POSITION,
        CONSTANTS.STATUS,
        'time'
    ];

    inStoreTaskFilter[CONSTANTS.COUNTRY] = getFilterConstant({
        displayName: {en: 'Country', ar: 'الدولة'},
        mandatory  : true,
        filterType : 'singleSelect'
    });
    inStoreTaskFilter[CONSTANTS.REGION] = getFilterConstant({
        displayName: {en: 'Region', ar: 'المنطقة'},
        filterType : 'multiSelect'
    });
    inStoreTaskFilter[CONSTANTS.SUBREGION] = getFilterConstant({
        displayName: {en: 'Sub-Region', ar: 'المنطقة الفرعية:'},
        filterType : 'multiSelect'
    });
    inStoreTaskFilter[CONSTANTS.RETAILSEGMENT] = getFilterConstant({
        displayName: {en: 'Trade Channel', ar: 'الفئة التجارية:'},
        filterType : 'multiSelect'
    });
    inStoreTaskFilter[CONSTANTS.OUTLET] = getFilterConstant({
        displayName: {en: 'Customer', ar: 'العميل'},
        filterType : 'multiSelect'
    });
    inStoreTaskFilter[CONSTANTS.BRANCH] = getFilterConstant({
        displayName: {en: 'Branch', ar: 'الفرع'},
        filterType : 'multiSelect'
    });
    inStoreTaskFilter[CONSTANTS.PRIORITY] = getFilterConstant({
        displayName: {en: 'Priority', ar: 'الأولوية'},
        type       : 'string',
        filterType : 'multiSelect'
    });
    inStoreTaskFilter[CONSTANTS.POSITION] = getFilterConstant({
        displayName: {en: 'Position', ar: 'المركز الوظيفي'},
        filterType : 'multiSelect'
    });
    inStoreTaskFilter[CONSTANTS.STATUS] = getFilterConstant({
        displayName: {en: 'Status', ar: 'الحالة'},
        type       : 'string',
        filterType : 'multiSelect'
    });
    inStoreTaskFilter.time = getFilterConstant({
        displayName: {en: 'Time', ar: 'الوقت'},
        type       : 'date',
        filterType : 'time'
    });
    inStoreTaskFilter.time.backendKeys = [
        {
            key     : 'createdBy.date',
            operator: ['$gte', '$lte']
        },
        {
            key     : 'editedBy.date',
            operator: ['$gte', '$lte']
        }
    ];
    inStoreTaskFilter.array = [
        CONSTANTS.COUNTRY,
        CONSTANTS.REGION,
        CONSTANTS.SUBREGION,
        CONSTANTS.RETAILSEGMENT,
        CONSTANTS.OUTLET,
        CONSTANTS.BRANCH,
        CONSTANTS.PRIORITY,
        CONSTANTS.POSITION,
        CONSTANTS.STATUS,
        'time'
    ];

    //branding and display filters
    brandingAndMonthlyDisplayFilter[CONSTANTS.CATEGORY] = getFilterConstant({
        displayName: {en: 'Product', ar: 'المنتج'},
        mandatory  : false,
        filterType : 'multiSelect'
    });
    brandingAndMonthlyDisplayFilter[CONSTANTS.COUNTRY] = getFilterConstant({
        displayName: {en: 'Country', ar: 'الدولة'},
        mandatory  : true,
        filterType : 'multiSelect'
    });
    brandingAndMonthlyDisplayFilter[CONSTANTS.REGION] = getFilterConstant({
        displayName: {en: 'Region', ar: 'المنطقة'},
        filterType : 'multiSelect'
    });
    brandingAndMonthlyDisplayFilter[CONSTANTS.SUBREGION] = getFilterConstant({
        displayName: {en: 'Sub-Region', ar: 'المنطقة الفرعية:'},
        filterType : 'multiSelect'
    });
    brandingAndMonthlyDisplayFilter[CONSTANTS.RETAILSEGMENT] = getFilterConstant({
        displayName: {en: 'Trade Channel', ar: 'الفئة التجارية:'},
        filterType : 'multiSelect'
    });
    brandingAndMonthlyDisplayFilter[CONSTANTS.OUTLET] = getFilterConstant({
        displayName: {en: 'Customer', ar: 'العميل'},
        filterType : 'multiSelect'
    });
    brandingAndMonthlyDisplayFilter[CONSTANTS.BRANCH] = getFilterConstant({
        displayName: {en: 'Branch', ar: 'الفرع'},
        filterType : 'multiSelect'
    });
    brandingAndMonthlyDisplayFilter[CONSTANTS.PERSONNEL] = getFilterConstant({
        displayName: {en: 'Employee', ar: 'الموظف'},
        filterType : 'multiSelect'
    });
    brandingAndMonthlyDisplayFilter[CONSTANTS.POSITION] = getFilterConstant({
        displayName: {en: 'Position', ar: 'المركز الوظيفي'},
        filterType : 'multiSelect'
    });
    brandingAndMonthlyDisplayFilter.time = getFilterConstant({
        displayName: {en: 'Time', ar: 'الوقت'},
        type       : 'date',
        filterType : 'time'
    });
    brandingAndMonthlyDisplayFilter.time.backendKeys = [
        {
            key     : 'createdBy.date',
            operator: ['$gte', '$lte']
        },
        {
            key     : 'editedBy.date',
            operator: ['$gte', '$lte']
        }
    ];
    brandingAndMonthlyDisplayFilter.array = [
        CONSTANTS.CATEGORY,
        CONSTANTS.COUNTRY,
        CONSTANTS.REGION,
        CONSTANTS.SUBREGION,
        CONSTANTS.RETAILSEGMENT,
        CONSTANTS.OUTLET,
        CONSTANTS.BRANCH,
        CONSTANTS.POSITION,
        CONSTANTS.PERSONNEL,
        'time'
    ];

    competitorBrandingFilter[CONSTANTS.CATEGORY] = getFilterConstant({
        displayName: {en: 'Product', ar: 'المنتج'},
        mandatory  : false,
        filterType : 'multiSelect'
    });
    competitorBrandingFilter[CONSTANTS.BRAND] = getFilterConstant({
        displayName: {en: 'Brand', ar: 'العلالي'},
        mandatory  : false,
        filterType : 'multiSelect'
    });
    competitorBrandingFilter[CONSTANTS.COUNTRY] = getFilterConstant({
        displayName: {en: 'Country', ar: 'الدولة'},
        mandatory  : true,
        filterType : 'multiSelect'
    });
    competitorBrandingFilter[CONSTANTS.REGION] = getFilterConstant({
        displayName: {en: 'Region', ar: 'المنطقة'},
        filterType : 'multiSelect'
    });
    competitorBrandingFilter[CONSTANTS.SUBREGION] = getFilterConstant({
        displayName: {en: 'Sub-Region', ar: 'المنطقة الفرعية:'},
        filterType : 'multiSelect'
    });
    competitorBrandingFilter[CONSTANTS.RETAILSEGMENT] = getFilterConstant({
        displayName: {en: 'Trade Channel', ar: 'الفئة التجارية:'},
        filterType : 'multiSelect'
    });
    competitorBrandingFilter[CONSTANTS.OUTLET] = getFilterConstant({
        displayName: {en: 'Customer', ar: 'العميل'},
        filterType : 'multiSelect'
    });
    competitorBrandingFilter[CONSTANTS.BRANCH] = getFilterConstant({
        displayName: {en: 'Branch', ar: 'الفرع'},
        filterType : 'multiSelect'
    });
    competitorBrandingFilter[CONSTANTS.PERSONNEL] = getFilterConstant({
        displayName: {en: 'Employee', ar: 'الموظف'},
        filterType : 'multiSelect'
    });
    competitorBrandingFilter[CONSTANTS.POSITION] = getFilterConstant({
        displayName: {en: 'Position', ar: 'المركز الوظيفي'},
        filterType : 'multiSelect'
    });
    competitorBrandingFilter.time = getFilterConstant({
        displayName: {en: 'Time', ar: 'الوقت'},
        type       : 'date',
        filterType : 'time'
    });
    competitorBrandingFilter.time.backendKeys = [
        // Comment according to QPCMS-2083 Reporting > Competitor branding > filtering by Fixed period should search by creation date
        // {
        //     key     : 'dateStart',
        //     operator: ['$gte', '$lte']
        // },
        // {
        //     key     : 'dateEnd',
        //     operator: ['$gte', '$lte']
        // },
        {
            key     : 'createdBy.date',
            operator: ['$gte', '$lte']
        },
        {
            key     : 'editedBy.date',
            operator: ['$gte', '$lte']
        }
    ];
    competitorBrandingFilter.array = [
        CONSTANTS.CATEGORY,
        CONSTANTS.BRAND,
        CONSTANTS.COUNTRY,
        CONSTANTS.REGION,
        CONSTANTS.SUBREGION,
        CONSTANTS.RETAILSEGMENT,
        CONSTANTS.OUTLET,
        CONSTANTS.BRANCH,
        CONSTANTS.POSITION,
        CONSTANTS.PERSONNEL,
        'time'
    ];

    // =============================== contactUs filters ===================================================
    contactUsFilter[CONSTANTS.COUNTRY] = getFilterConstant({
        displayName: {en: 'Country', ar: 'الدولة'},
        mandatory  : true,
        filterType : 'singleSelect'
    });

    contactUsFilter[CONSTANTS.POSITION] = getFilterConstant({
        displayName: {en: 'Position', ar: 'المركز الوظيفي'},
        filterType : 'multiSelect'
    });

    contactUsFilter[CONSTANTS.PERSONNEL] = getFilterConstant({
        displayName: {en: 'Employee', ar: 'الموظف'},
        filterType : 'multiSelect'
    });

    contactUsFilter.type = getFilterConstant({
        displayName: {en: 'Type', ar: 'النوع'},
        filterType : 'multiSelect'
    });

    contactUsFilter[CONSTANTS.STATUS] = getFilterConstant({
        displayName: {en: 'Status', ar: 'الحالة'},
        filterType : 'multiSelect'
    });

    contactUsFilter.time = getFilterConstant({
        displayName: {en: 'Time', ar: 'الوقت'},
        type       : 'date',
        filterType : 'time'
    });

    contactUsFilter.array = [
        CONSTANTS.COUNTRY,
        CONSTANTS.POSITION,
        CONSTANTS.PERSONNEL,
        'type',
        CONSTANTS.STATUS,
        'time'
    ];

    // ================================== achievementForm filters ========================================
    achievementFormFilter[CONSTANTS.COUNTRY] = getFilterConstant({
        displayName: {en: 'Country', ar: 'الدولة'},
        mandatory  : true,
        filterType : 'multiSelect'
    });
    achievementFormFilter[CONSTANTS.REGION] = getFilterConstant({
        displayName: {en: 'Region', ar: 'المنطقة'},
        filterType : 'multiSelect'
    });
    achievementFormFilter[CONSTANTS.SUBREGION] = getFilterConstant({
        displayName: {en: 'Sub-Region', ar: 'المنطقة الفرعية:'},
        filterType : 'multiSelect'
    });
    achievementFormFilter[CONSTANTS.RETAILSEGMENT] = getFilterConstant({
        displayName: {en: 'Trade Channel', ar: 'الفئة التجارية:'},
        filterType : 'multiSelect'
    });
    achievementFormFilter[CONSTANTS.OUTLET] = getFilterConstant({
        displayName: {en: 'Customer', ar: 'العميل'},
        filterType : 'multiSelect'
    });
    achievementFormFilter[CONSTANTS.BRANCH] = getFilterConstant({
        displayName: {en: 'Branch', ar: 'الفرع'},
        filterType : 'multiSelect'
    });
    achievementFormFilter[CONSTANTS.POSITION] = getFilterConstant({
        displayName: {en: 'Position', ar: 'المركز الوظيفي'},
        filterType : 'multiSelect'
    });
    achievementFormFilter[CONSTANTS.PERSONNEL] = getFilterConstant({
        displayName: {en: 'Employee', ar: 'الموظف'},
        filterType : 'multiSelect'
    });
    achievementFormFilter.time = getFilterConstant({
        displayName: {en: 'Time', ar: 'الوقت'},
        type       : 'date',
        filterType : 'time'
    });
    achievementFormFilter.time.backendKeys = [
        {
            key     : 'createdBy.date',
            operator: ['$gte', '$lte']
        },
        {
            key     : 'editedBy.date',
            operator: ['$gte', '$lte']
        }
    ];
    achievementFormFilter.array = [
        CONSTANTS.COUNTRY,
        CONSTANTS.REGION,
        CONSTANTS.SUBREGION,
        CONSTANTS.RETAILSEGMENT,
        CONSTANTS.OUTLET,
        CONSTANTS.BRANCH,
        CONSTANTS.POSITION,
        CONSTANTS.PERSONNEL,
        'time'
    ];

    newProductLaunchFilter[CONSTANTS.COUNTRY] = getFilterConstant({
        displayName: {en: 'Country', ar: 'الدولة'},
        mandatory  : true,
        filterType : 'multiSelect'
    });
    newProductLaunchFilter[CONSTANTS.REGION] = getFilterConstant({
        displayName: {en: 'Region', ar: 'المنطقة'},
        filterType : 'multiSelect'
    });
    newProductLaunchFilter[CONSTANTS.SUBREGION] = getFilterConstant({
        displayName: {en: 'Sub-Region', ar: 'المنطقة الفرعية:'},
        filterType : 'multiSelect'
    });
    newProductLaunchFilter[CONSTANTS.RETAILSEGMENT] = getFilterConstant({
        displayName: {en: 'Trade Channel', ar: 'الفئة التجارية:'},
        filterType : 'multiSelect'
    });
    newProductLaunchFilter[CONSTANTS.OUTLET] = getFilterConstant({
        displayName: {en: 'Customer', ar: 'العميل'},
        filterType : 'multiSelect'
    });
    newProductLaunchFilter[CONSTANTS.BRANCH] = getFilterConstant({
        displayName: {en: 'Branch', ar: 'الفرع'},
        filterType : 'multiSelect'
    });
    newProductLaunchFilter[CONSTANTS.POSITION] = getFilterConstant({
        displayName: {en: 'Position', ar: 'المركز الوظيفي'},
        filterType : 'multiSelect'
    });
    newProductLaunchFilter[CONSTANTS.PERSONNEL] = getFilterConstant({
        displayName: {en: 'Employee', ar: 'الموظف'},
        filterType : 'multiSelect'
    });
    newProductLaunchFilter.time = getFilterConstant({
        displayName: {en: 'Time', ar: 'الوقت'},
        type       : 'date',
        filterType : 'time'
    });
    newProductLaunchFilter.time.backendKeys = [
        {
            key     : 'createdBy.date',
            operator: ['$gte', '$lte']
        },
        {
            key     : 'editedBy.date',
            operator: ['$gte', '$lte']
        }
    ];
    newProductLaunchFilter.array = [
        CONSTANTS.COUNTRY,
        CONSTANTS.REGION,
        CONSTANTS.SUBREGION,
        CONSTANTS.RETAILSEGMENT,
        CONSTANTS.OUTLET,
        CONSTANTS.BRANCH,
        CONSTANTS.POSITION,
        CONSTANTS.PERSONNEL,
        'time'
    ];

    competitorPromotionFilter[CONSTANTS.CATEGORY] = getFilterConstant({
        displayName: {en: 'Product', ar: 'المنتج'},
        mandatory  : true,
        filterType : 'multiSelect'
    });
    competitorPromotionFilter[CONSTANTS.BRAND] = getFilterConstant({
        displayName: {en: 'Brand', ar: 'العلالي'},
        mandatory  : false,
        filterType : 'multiSelect'
    });
    competitorPromotionFilter[CONSTANTS.COUNTRY] = getFilterConstant({
        displayName: {en: 'Country', ar: 'الدولة'},
        mandatory  : true,
        filterType : 'multiSelect'
    });
    competitorPromotionFilter[CONSTANTS.REGION] = getFilterConstant({
        displayName: {en: 'Region', ar: 'المنطقة'},
        filterType : 'multiSelect'
    });
    competitorPromotionFilter[CONSTANTS.SUBREGION] = getFilterConstant({
        displayName: {en: 'Sub-Region', ar: 'المنطقة الفرعية:'},
        filterType : 'multiSelect'
    });
    competitorPromotionFilter[CONSTANTS.RETAILSEGMENT] = getFilterConstant({
        displayName: {en: 'Trade Channel', ar: 'الفئة التجارية:'},
        filterType : 'multiSelect'
    });
    competitorPromotionFilter[CONSTANTS.OUTLET] = getFilterConstant({
        displayName: {en: 'Customer', ar: 'العميل'},
        filterType : 'multiSelect'
    });
    competitorPromotionFilter[CONSTANTS.BRANCH] = getFilterConstant({
        displayName: {en: 'Branch', ar: 'الفرع'},
        filterType : 'multiSelect'
    });
    competitorPromotionFilter[CONSTANTS.PERSONNEL] = getFilterConstant({
        displayName: {en: 'Employee', ar: 'الموظف'},
        filterType : 'multiSelect'
    });
    competitorPromotionFilter[CONSTANTS.POSITION] = getFilterConstant({
        displayName: {en: 'Position', ar: 'المركز الوظيفي'},
        filterType : 'multiSelect'
    });
    competitorPromotionFilter.time = getFilterConstant({
        displayName: {en: 'Time', ar: 'الوقت'},
        type       : 'date',
        filterType : 'time'
    });
    competitorPromotionFilter.time.backendKeys = [
        {
            key     : 'createdBy.date',
            operator: ['$gte', '$lte']
        },
        {
            key     : 'editedBy.date',
            operator: ['$gte', '$lte']
        }
    ];
    competitorPromotionFilter.array = [
        CONSTANTS.CATEGORY,
        CONSTANTS.BRAND,
        CONSTANTS.COUNTRY,
        CONSTANTS.REGION,
        CONSTANTS.SUBREGION,
        CONSTANTS.RETAILSEGMENT,
        CONSTANTS.OUTLET,
        CONSTANTS.BRANCH,
        CONSTANTS.POSITION,
        CONSTANTS.PERSONNEL,
        'time'
    ];

    promotionFilter[CONSTANTS.CATEGORY] = getFilterConstant({
        displayName: {en: 'Product', ar: 'المنتج'},
        mandatory  : true,
        filterType : 'multiSelect'
    });
    promotionFilter[CONSTANTS.COUNTRY] = getFilterConstant({
        displayName: {en: 'Country', ar: 'الدولة'},
        mandatory  : true,
        filterType : 'singleSelect'
    });
    promotionFilter[CONSTANTS.REGION] = getFilterConstant({
        displayName: {en: 'Region', ar: 'المنطقة'},
        filterType : 'singleSelect'
    });
    promotionFilter[CONSTANTS.SUBREGION] = getFilterConstant({
        displayName: {en: 'Sub-Region', ar: 'المنطقة الفرعية:'},
        filterType : 'singleSelect'
    });
    promotionFilter[CONSTANTS.RETAILSEGMENT] = getFilterConstant({
        displayName: {en: 'Trade Channel', ar: 'الفئة التجارية:'},
        filterType : 'singleSelect'
    });
    promotionFilter[CONSTANTS.OUTLET] = getFilterConstant({
        displayName: {en: 'Customer', ar: 'العميل'},
        filterType : 'multiSelect'
    });
    promotionFilter[CONSTANTS.BRANCH] = getFilterConstant({
        displayName: {en: 'Branch', ar: 'الفرع'},
        filterType : 'multiSelect'
    });
    promotionFilter[CONSTANTS.PERSONNEL] = getFilterConstant({
        displayName: {en: 'Employee', ar: 'الموظف'},
        filterType : 'multiSelect'
    });
    promotionFilter[CONSTANTS.POSITION] = getFilterConstant({
        displayName: {en: 'Position', ar: 'المركز الوظيفي'},
        filterType : 'multiSelect'
    });
    promotionFilter.time = getFilterConstant({
        displayName: {en: 'Time', ar: 'الوقت'},
        type       : 'date',
        filterType : 'time'
    });
    promotionFilter.time.backendKeys = [
        {
            key     : 'createdBy.date',
            operator: ['$gte', '$lte']
        },
        {
            key     : 'editedBy.date',
            operator: ['$gte', '$lte']
        }
    ];
    promotionFilter[CONSTANTS.STATUS] = getFilterConstant({
        displayName: {en: 'Status', ar: 'الحالة'},
        type       : 'string',
        filterType : 'singleSelect'
    });
    promotionFilter.array = [
        CONSTANTS.CATEGORY,
        CONSTANTS.COUNTRY,
        CONSTANTS.REGION,
        CONSTANTS.SUBREGION,
        CONSTANTS.RETAILSEGMENT,
        CONSTANTS.OUTLET,
        CONSTANTS.BRANCH,
        CONSTANTS.POSITION,
        CONSTANTS.PERSONNEL,
        'time',
        CONSTANTS.STATUS
    ];

    planogramFilter[CONSTANTS.COUNTRY] = getFilterConstant({
        displayName: {en: 'Country', ar: 'الدولة'},
        mandatory  : true,
        filterType : 'multiSelect'
    });
    planogramFilter[CONSTANTS.RETAILSEGMENT] = getFilterConstant({
        displayName: {en: 'Trade Channel', ar: 'الفئة التجارية:'},
        filterType : 'multiSelect'
    });
    planogramFilter.product = getFilterConstant({
        displayName: {en: 'Product', ar: 'المنتج'},
        mandatory  : true,
        filterType : 'multiSelect'
    });
    planogramFilter[CONSTANTS.CONFIGURATIONS] = getFilterConstant({
        displayName: {en: 'Configuration', ar: 'أبعاد واحجام التكوين'},
        filterType : 'multiSelect'
    });
    planogramFilter[CONSTANTS.DISPLAY_TYPE] = getFilterConstant({
        displayName: {en: 'Display Type', ar: 'نوع العرض'},
        filterType : 'multiSelect'
    });
    planogramFilter.array = [
        CONSTANTS.COUNTRY,
        CONSTANTS.RETAILSEGMENT,
        'product',
        CONSTANTS.CONFIGURATIONS,
        CONSTANTS.DISPLAY_TYPE
    ];

    itemsPricesFilter[CONSTANTS.CATEGORY] = getFilterConstant({
        displayName: {en: 'Product', ar: 'المنتج'},
        mandatory  : true,
        filterType : 'multiSelect'
    });
    itemsPricesFilter[CONSTANTS.COUNTRY] = getFilterConstant({
        displayName: {en: 'Country', ar: 'الدولة'},
        mandatory  : true,
        filterType : 'singleSelect'
    });
    itemsPricesFilter[CONSTANTS.OUTLET] = getFilterConstant({
        displayName: {en: 'Customer', ar: 'العميل'},
        filterType : 'multiSelect'
    });
    itemsPricesFilter[CONSTANTS.VARIANT] = getFilterConstant({
        displayName: {en: 'Variant', ar: 'النوع'},
        filterType : 'multiSelect'
    });
    itemsPricesFilter[CONSTANTS.ORIGIN] = getFilterConstant({
        displayName: {en: 'Origin', ar: 'بلد المشأ'},
        filterType : 'multiSelect'
    });
    itemsPricesFilter[CONSTANTS.RETAILSEGMENT] = getFilterConstant({
        displayName: {en: 'Trade Channel', ar: 'الفئة التجارية:'},
        filterType : 'multiSelect'
    });
    itemsPricesFilter.array = [
        CONSTANTS.COUNTRY,
        CONSTANTS.CATEGORY,
        CONSTANTS.VARIANT,
        CONSTANTS.RETAILSEGMENT,
        CONSTANTS.OUTLET,
        CONSTANTS.ORIGIN
    ];

    itemsLocationFilter[CONSTANTS.COUNTRY] = getFilterConstant({
        displayName: {en: 'Country', ar: 'الدولة'},
        filterType : 'multiSelect'
    });
    itemsLocationFilter[CONSTANTS.REGION] = getFilterConstant({
        displayName: {en: 'Region', ar: 'المنطقة'},
        filterType : 'multiSelect'
    });
    itemsLocationFilter[CONSTANTS.SUBREGION] = getFilterConstant({
        displayName: {en: 'Sub-Region', ar: 'المنطقة الفرعية:'},
        filterType : 'multiSelect'
    });
    itemsLocationFilter[CONSTANTS.RETAILSEGMENT] = getFilterConstant({
        displayName: {en: 'Trade Channel', ar: 'الفئة التجارية:'},
        filterType : 'multiSelect'
    });
    itemsLocationFilter[CONSTANTS.OUTLET] = getFilterConstant({
        displayName: {en: 'Customer', ar: 'العميل'},
        filterType : 'multiSelect'
    });
    itemsLocationFilter.array = [
        CONSTANTS.COUNTRY,
        CONSTANTS.REGION,
        CONSTANTS.SUBREGION,
        CONSTANTS.RETAILSEGMENT,
        CONSTANTS.OUTLET
    ];

    competitorsFilter[CONSTANTS.COUNTRY] = getFilterConstant({
        displayName: {en: 'Country', ar: 'الدولة'},
        mandatory  : true,
        filterType : 'singleSelect'
    });
    competitorsFilter[CONSTANTS.BRAND] = getFilterConstant({
        displayName: {en: 'Brand', ar: 'العلالي'},
        filterType : 'multiSelect'
    });
    competitorsFilter[CONSTANTS.ORIGIN] = getFilterConstant({
        displayName: 'Origin',
        filterType : 'multiSelect'
    });
    competitorsFilter[CONSTANTS.PRODUCT] = getFilterConstant({
        displayName: {en: 'Product', ar: 'المنتج'},
        filterType : 'multiSelect'
    });
    competitorsFilter.array = [
        CONSTANTS.COUNTRY,
        CONSTANTS.BRAND,
        CONSTANTS.ORIGIN,
        CONSTANTS.PRODUCT
    ];

    personnelTasksFilter[CONSTANTS.PRIORITY] = getFilterConstant({
        displayName: {en: 'Priority', ar: 'الأولوية'},
        type       : 'string',
        filterType : 'multiSelect'
    });
    personnelTasksFilter[CONSTANTS.OBJECTIVETYPE] = getFilterConstant({
        displayName: {en: 'Type', ar: 'النوع'},
        type       : 'string',
        filterType : 'multiSelect'
    });
    personnelTasksFilter[CONSTANTS.STATUS] = getFilterConstant({
        displayName: {en: 'Status', ar: 'الحالة'},
        type       : 'string',
        filterType : 'multiSelect'
    });
    personnelTasksFilter.time = getFilterConstant({
        displayName: {en: 'Time', ar: 'الوقت'},
        type       : 'date',
        filterType : 'time'
    });
    personnelTasksFilter.time.backendKeys = [
        {
            key     : 'createdBy.date',
            operator: ['$gte', '$lte']
        },
        {
            key     : 'editedBy.date',
            operator: ['$gte', '$lte']
        },
        {
            key     : 'dateStart',
            operator: ['$gte', '$lte']
        },
        {
            key     : 'dateEnd',
            operator: ['$gte', '$lte']
        }
    ];
    personnelTasksFilter.array = [
        CONSTANTS.PRIORITY,
        CONSTANTS.OBJECTIVETYPE,
        CONSTANTS.STATUS,
        'time'
    ];

    contractsYearlyFilter[CONSTANTS.COUNTRY] = getFilterConstant({
        displayName: {en: 'Country', ar: 'الدولة'},
        mandatory  : true,
        filterType : 'singleSelect'
    });
    contractsYearlyFilter[CONSTANTS.REGION] = getFilterConstant({
        displayName: {en: 'Region', ar: 'المنطقة'},
        filterType : 'multiSelect'
    });
    contractsYearlyFilter[CONSTANTS.SUBREGION] = getFilterConstant({
        displayName: {en: 'Sub-Region', ar: 'المنطقة الفرعية:'},
        filterType : 'multiSelect'
    });
    contractsYearlyFilter[CONSTANTS.RETAILSEGMENT] = getFilterConstant({
        displayName: {en: 'Trade Channel', ar: 'الفئة التجارية:'},
        filterType : 'multiSelect'
    });
    contractsYearlyFilter[CONSTANTS.OUTLET] = getFilterConstant({
        displayName: {en: 'Customer', ar: 'العميل'},
        filterType : 'multiSelect'
    });
    contractsYearlyFilter[CONSTANTS.BRANCH] = getFilterConstant({
        displayName: {en: 'Branch', ar: 'الفرع'},
        filterType : 'multiSelect'
    });
    contractsYearlyFilter[CONSTANTS.CONTRACT_TYPE] = getFilterConstant({
        displayName: {en: 'Type', ar: 'النوع'},
        type       : 'string',
        filterType : 'singleSelect'
    });
    contractsYearlyFilter.time = getFilterConstant({
        displayName: {en: 'Time', ar: 'الوقت'},
        type       : 'date',
        filterType : 'time'
    });
    contractsYearlyFilter.time.backendKeys = [
        {
            key     : 'createdBy.date',
            operator: ['$gte', '$lte']
        },
        {
            key     : 'editedBy.date',
            operator: ['$gte', '$lte']
        }
    ];
    contractsYearlyFilter[CONSTANTS.STATUS] = getFilterConstant({
        displayName: {en: 'Status', ar: 'الحالة'},
        type       : 'string',
        filterType : 'multiSelect'
    });
    contractsYearlyFilter.array = [
        CONSTANTS.COUNTRY,
        CONSTANTS.REGION,
        CONSTANTS.SUBREGION,
        CONSTANTS.RETAILSEGMENT,
        CONSTANTS.OUTLET,
        CONSTANTS.BRANCH,
        CONSTANTS.CONTRACT_TYPE,
        'time',
        CONSTANTS.STATUS
    ];

    contractsSecondaryFilter[CONSTANTS.COUNTRY] = getFilterConstant({
        mandatory  : true,
        filterType : 'multiSelect',
        displayName: {
            en: 'Country',
            ar: 'الدولة'
        }
    });
    contractsSecondaryFilter[CONSTANTS.REGION] = getFilterConstant({
        displayName: {en: 'Region', ar: 'المنطقة'},
        filterType : 'multiSelect'
    });
    contractsSecondaryFilter[CONSTANTS.SUBREGION] = getFilterConstant({
        displayName: {en: 'Sub-Region', ar: 'المنطقة الفرعية:'},
        filterType : 'multiSelect'
    });
    contractsSecondaryFilter[CONSTANTS.RETAILSEGMENT] = getFilterConstant({
        displayName: {en: 'Trade Channel', ar: 'الفئة التجارية:'},
        filterType : 'multiSelect'
    });
    contractsSecondaryFilter[CONSTANTS.OUTLET] = getFilterConstant({
        displayName: {en: 'Customer', ar: 'العميل'},
        filterType : 'multiSelect'
    });
    contractsSecondaryFilter[CONSTANTS.BRANCH] = getFilterConstant({
        displayName: {en: 'Branch', ar: 'الفرع'},
        filterType : 'multiSelect'
    });
    contractsSecondaryFilter[CONSTANTS.CATEGORY] = getFilterConstant({
        displayName: {en: 'Category', ar: 'الفئة'},
        filterType : 'multiSelect'
    });
    contractsSecondaryFilter[CONSTANTS.CONTRACT_TYPE] = getFilterConstant({
        displayName: {en: 'Type', ar: 'النوع'},
        type       : 'string',
        filterType : 'multiSelect'
    });
    contractsSecondaryFilter.time = getFilterConstant({
        displayName: {en: 'Time', ar: 'الوقت'},
        type       : 'date',
        filterType : 'time'
    });
    contractsSecondaryFilter.time.backendKeys = [
        {
            key     : 'createdBy.date',
            operator: ['$gte', '$lte']
        },
        {
            key     : 'editedBy.date',
            operator: ['$gte', '$lte']
        }
    ];
    contractsSecondaryFilter[CONSTANTS.STATUS] = getFilterConstant({
        displayName: {en: 'Status', ar: 'الحالة'},
        type       : 'string',
        filterType : 'multiSelect'
    });
    contractsSecondaryFilter.array = [
        CONSTANTS.COUNTRY,
        CONSTANTS.REGION,
        CONSTANTS.SUBREGION,
        CONSTANTS.RETAILSEGMENT,
        CONSTANTS.OUTLET,
        CONSTANTS.BRANCH,
        CONSTANTS.CATEGORY,
        CONSTANTS.CONTRACT_TYPE,
        'time',
        CONSTANTS.STATUS
    ];

    filters[CONSTANTS.BRANDING_AND_MONTHLY_DISPLAY] = brandingAndMonthlyDisplayFilter;
    filters[CONSTANTS.MARKETING_CAMPAIGN] = marketingCampaignFilter;
    filters[CONSTANTS.PERSONNEL] = personnelFilter;
    filters[CONSTANTS.SHELFSHARES] = shelfSharesFilter;
    filters[CONSTANTS.PRICESURVEY] = priceSurveyFilter;
    filters[CONSTANTS.NOTIFICATIONS] = notificationsFilter;
    filters[CONSTANTS.OBJECTIVES] = objectivesFilter;
    filters[CONSTANTS.NEWPRODUCTLAUNCH] = newProductLaunchFilter;
    filters[CONSTANTS.ACHIEVEMENTFORM] = achievementFormFilter;
    filters[CONSTANTS.INSTORETASKS] = inStoreTaskFilter;
    filters[CONSTANTS.COMPETITORBRANDING] = competitorBrandingFilter;
    filters[CONSTANTS.COMPETITORPROMOTION] = competitorPromotionFilter;
    filters[CONSTANTS.CREATEQUESTIONNARIES] = createQuestionnary;
    filters[CONSTANTS.CREATE_CONSUMER_SURVEY] = createConsumersSurvey;
    filters[CONSTANTS.QUESTIONNARIES] = questionnaryFilter;
    filters[CONSTANTS.CONSUMER_SURVEY] = consumersSurveyFilter;
    filters[CONSTANTS.PROMOTIONS] = promotionFilter;
    filters[CONSTANTS.ITEMSPRICES] = itemsPricesFilter;
    filters[CONSTANTS.ITEMSLOCATION] = itemsLocationFilter;
    filters[CONSTANTS.PLANOGRAM] = planogramFilter;
    filters[CONSTANTS.COMPETITORSLIST] = competitorsFilter;
    filters[CONSTANTS.PERSONNELTASKS] = personnelTasksFilter;
    filters[CONSTANTS.CONTACT_US] = contactUsFilter;

    filters[CONSTANTS.CONTRACTSYEARLY] = contractsYearlyFilter;
    filters[CONSTANTS.CONTRACTSSECONDARY] = contractsSecondaryFilter;
    filters[CONSTANTS.DOCUMENTS] = documentsFilter;
    filters[CONSTANTS.NOTES] = notesFilter;

    filters[CONSTANTS.COUNTRY] = domainsFilter;
    filters[CONSTANTS.REGION] = domainsFilter;
    filters[CONSTANTS.SUBREGION] = domainsFilter;
    filters[CONSTANTS.RETAILSEGMENT] = domainsFilter;
    filters[CONSTANTS.OUTLET] = domainsFilter;
    filters[CONSTANTS.BRANCH] = domainsFilter;
    filters[CONSTANTS.ACTIVITYLIST] = activityListFilter;

    return {
        FILTERS              : filters,
        TRANSLATED_COLLECTION: translatedCollection,
        RATED_COLLECTION     : ratedCollection,
        TIME_COLLECTION      : timeCollection,
        FILTER_VALUES_COUNT  : 7
    };
}

module.exports = getConstants(CONSTANTS);
