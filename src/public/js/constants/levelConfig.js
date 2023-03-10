var CONTENT_TYPES = require('./contentType');

var config = {};

var objectivesConfig = {
    1           : {
        preview: [
            {
                selector       : '#topButtons',
                elementId      : 'duplicate',
                insertType     : 'append',
                template       : 'previewButtons.duplicate',
                forAll         : false,
                forAllWithoutMy: false
            },
            {
                selector       : '#topButtons',
                elementId      : 'edit',
                insertType     : 'append',
                template       : 'previewButtons.edit',
                forAll         : true,
                forAllWithoutMy: false
            },
            {
                selector       : '#subObjective',
                insertType     : 'append',
                elementId      : 'viewSubObjective',
                template       : 'previewButtons.viewSubObjective',
                forAll         : true,
                forAllWithoutMy: false
            }
        ]
    },
    2           : {
        preview: [
            {
                selector       : '#topButtons',
                insertType     : 'append',
                elementId      : 'edit',
                template       : 'previewButtons.edit',
                forAll         : false,
                forAllWithoutMy: false
            },
            {
                selector       : '#topButtons',
                elementId      : 'duplicate',
                insertType     : 'append',
                template       : 'previewButtons.duplicate',
                forAll         : false,
                forAllWithoutMy: false
            },
            {
                selector       : '#subObjective',
                insertType     : 'append',
                elementId      : 'createSubObjective',
                template       : 'previewButtons.subObjective',
                forAll         : false,
                forAllWithoutMy: true
            },
            {
                selector       : '#subObjective',
                insertType     : 'append',
                elementId      : 'viewSubObjective',
                template       : 'previewButtons.viewSubObjective',
                forAll         : true,
                forAllWithoutMy: false
            }
        ]
    },
    3           : {
        preview: [
            {
                selector       : '#topButtons',
                insertType     : 'append',
                elementId      : 'edit',
                template       : 'previewButtons.edit',
                forAll         : false,
                forAllWithoutMy: false
            },
            {
                selector       : '#topButtons',
                insertType     : 'append',
                elementId      : 'assign',
                template       : 'previewButtons.assign',
                forAll         : false,
                forAllWithoutMy: true
            },
            {
                selector       : '#topButtons',
                elementId      : 'duplicate',
                insertType     : 'append',
                template       : 'previewButtons.duplicate',
                forAll         : false,
                forAllWithoutMy: false
            },
            {
                selector       : '#subObjective',
                insertType     : 'append',
                elementId      : 'viewSubObjective',
                template       : 'previewButtons.viewSubObjective',
                forAll         : true,
                forAllWithoutMy: false
            }
        ]
    },
    4           : {
        preview: [
            {
                selector       : '#topButtons',
                insertType     : 'append',
                elementId      : 'edit',
                template       : 'previewButtons.edit',
                forAll         : false,
                forAllWithoutMy: false
            },
            {
                selector       : '#topButtons',
                insertType     : 'append',
                elementId      : 'assign',
                template       : 'previewButtons.assign',
                forAll         : false,
                forAllWithoutMy: true
            },
            {
                selector       : '#topButtons',
                elementId      : 'duplicate',
                insertType     : 'append',
                template       : 'previewButtons.duplicate',
                forAll         : false,
                forAllWithoutMy: false
            },
            {
                selector       : '#subObjective',
                insertType     : 'append',
                elementId      : 'viewSubObjective',
                template       : 'previewButtons.viewSubObjective',
                forAll         : true,
                forAllWithoutMy: false
            }
        ]
    },
    5           : {
        preview: []
    },
    activityList: {
        preview: [
            {
                selector       : '#topButtons',
                insertType     : 'append',
                elementId      : 'goToBtn',
                template       : 'previewButtons.goTo',
                forAll         : true,
                forAllWithoutMy: false
            }
        ]
    }
};

var inStoreDefaultConfig = {
    preview: [
        {
            selector       : '#topButtons',
            elementId      : 'duplicate',
            insertType     : 'append',
            template       : 'previewButtons.duplicate',
            forAll         : false,
            forAllWithoutMy: false
        },
        {
            selector       : '#topButtons',
            elementId      : 'edit',
            insertType     : 'append',
            template       : 'previewButtons.edit',
            forAll         : false,
            forAllWithoutMy: false
        },
        {
            selector       : '#topButtons',
            insertType     : 'append',
            elementId      : 'assign',
            template       : 'previewButtons.assign',
            forAll         : false,
            forAllWithoutMy: true
        }
    ]
};

var inStoreTasksConfig = {
    1           : inStoreDefaultConfig,
    2           : inStoreDefaultConfig,
    3           : inStoreDefaultConfig,
    4           : inStoreDefaultConfig,
    5           : {
        preview: []
    },
    10 : inStoreDefaultConfig,
    activityList: {
        preview: [
            {
                selector       : '#topButtons',
                insertType     : 'append',
                elementId      : 'goToBtn',
                template       : 'previewButtons.goTo',
                forAll         : true,
                forAllWithoutMy: false
            }
        ]
    }
};

var documentsConfig = {
    activityList: {
        preview: [
            {
                selector       : '#topButtons',
                insertType     : 'append',
                elementId      : 'goToBtn',
                template       : 'previewButtons.goTo',
                forAll         : true,
                forAllWithoutMy: false
            }
        ]
    }
};

var notesConfig = {
    activityList: {
        preview: [
            {
                selector       : '#topButtons',
                insertType     : 'append',
                elementId      : 'goToBtn',
                template       : 'previewButtons.goTo',
                forAll         : true,
                forAllWithoutMy: false
            }
        ]
    }
};

var contractsSecondaryConfig = {
    1           : {
        preview: [
            {
                selector       : '#topButtons',
                elementId      : 'duplicate',
                insertType     : 'append',
                template       : 'previewButtons.duplicate',
                forAll         : true,
                forAllWithoutMy: false
            },
            {
                selector       : '#topButtons',
                elementId      : 'edit',
                insertType     : 'append',
                template       : 'previewButtons.edit',
                forAll         : true,
                forAllWithoutMy: false
            }
        ]
    },
    activityList: {
        preview: [
            {
                selector       : '#topButtons',
                insertType     : 'append',
                elementId      : 'goToBtn',
                template       : 'previewButtons.goTo',
                forAll         : true,
                forAllWithoutMy: false
            }
        ]
    }
};

var contractsYearlyConfig = {
    1           : {
        preview: [
            {
                selector       : '#topButtons',
                elementId      : 'duplicate',
                insertType     : 'append',
                template       : 'previewButtons.duplicate',
                forAll         : true,
                forAllWithoutMy: false
            },
            {
                selector       : '#topButtons',
                elementId      : 'edit',
                insertType     : 'append',
                template       : 'previewButtons.edit',
                forAll         : true,
                forAllWithoutMy: false
            }
        ]
    },
    activityList: {
        preview: [
            {
                selector       : '#topButtons',
                insertType     : 'append',
                elementId      : 'goToBtn',
                template       : 'previewButtons.goTo',
                forAll         : true,
                forAllWithoutMy: false
            }
        ]
    }
};

var questionaryConfig = {
    activityList: {
        preview: [
            {
                selector       : '#topButtons',
                insertType     : 'append',
                elementId      : 'goToBtn',
                template       : 'previewButtons.goTo',
                forAll         : true,
                forAllWithoutMy: false
            }
        ]
    }
};

var consumersSurveyConfig = {
    activityList: {
        preview: [
            {
                selector       : '#topButtons',
                insertType     : 'append',
                elementId      : 'goToBtn',
                template       : 'previewButtons.goTo',
                forAll         : true,
                forAllWithoutMy: false
            }
        ]
    }
};

var brandingAndDisplayConfig = {
    1           : {
        preview: [
            {
                selector       : '#topButtons',
                elementId      : 'brandingAndDisplayItems',
                insertType     : 'append',
                template       : 'previewButtons.table',
                forAll         : true,
                forAllWithoutMy: false
            },
            {
                selector       : '#topButtons',
                elementId      : 'duplicate',
                insertType     : 'append',
                template       : 'previewButtons.duplicate',
                forAll         : true,
                forAllWithoutMy: false
            },
            {
                selector       : '#topButtons',
                elementId      : 'edit',
                insertType     : 'append',
                template       : 'previewButtons.edit',
                forAll         : true,
                forAllWithoutMy: false
            }
        ]
    },
    2           : {
        preview: [
            {
                selector       : '#topButtons',
                elementId      : 'brandingAndDisplayItems',
                insertType     : 'append',
                template       : 'previewButtons.table',
                forAll         : true,
                forAllWithoutMy: false
            },
            {
                selector       : '#topButtons',
                elementId      : 'duplicate',
                insertType     : 'append',
                template       : 'previewButtons.duplicate',
                forAll         : true,
                forAllWithoutMy: false
            },
            {
                selector       : '#topButtons',
                elementId      : 'edit',
                insertType     : 'append',
                template       : 'previewButtons.edit',
                forAll         : true,
                forAllWithoutMy: false
            }
        ]
    },
    3           : {
        preview: [
            {
                selector       : '#topButtons',
                elementId      : 'brandingAndDisplayItems',
                insertType     : 'append',
                template       : 'previewButtons.table',
                forAll         : true,
                forAllWithoutMy: false
            }
        ]
    },
    4           : {
        preview: [
            {
                selector       : '#topButtons',
                elementId      : 'brandingAndDisplayItems',
                insertType     : 'append',
                template       : 'previewButtons.table',
                forAll         : true,
                forAllWithoutMy: false
            }
        ]
    },
    5           : {
        preview: [
            {
                selector       : '#topButtons',
                elementId      : 'brandingAndDisplayItems',
                insertType     : 'append',
                template       : 'previewButtons.table',
                forAll         : true,
                forAllWithoutMy: false
            }
        ]
    },
    6           : {
        preview: [
            {
                selector       : '#topButtons',
                elementId      : 'brandingAndDisplayItems',
                insertType     : 'append',
                template       : 'previewButtons.table',
                forAll         : true,
                forAllWithoutMy: false
            }
        ]
    },
    7           : {
        preview: [
            {
                selector       : '#topButtons',
                elementId      : 'brandingAndDisplayItems',
                insertType     : 'append',
                template       : 'previewButtons.table',
                forAll         : true,
                forAllWithoutMy: false
            }
        ]
    },
    8           : {
        preview: [
            {
                selector       : '#topButtons',
                elementId      : 'brandingAndDisplayItems',
                insertType     : 'append',
                template       : 'previewButtons.table',
                forAll         : true,
                forAllWithoutMy: false
            },
            {
                selector       : '#topButtons',
                elementId      : 'duplicate',
                insertType     : 'append',
                template       : 'previewButtons.duplicate',
                forAll         : true,
                forAllWithoutMy: false
            },
            {
                selector       : '#topButtons',
                elementId      : 'edit',
                insertType     : 'append',
                template       : 'previewButtons.edit',
                forAll         : true,
                forAllWithoutMy: false
            }
        ]
    },
    9           : {
        preview: [
            {
                selector       : '#topButtons',
                elementId      : 'brandingAndDisplayItems',
                insertType     : 'append',
                template       : 'previewButtons.table',
                forAll         : true,
                forAllWithoutMy: false
            },
            {
                selector       : '#topButtons',
                elementId      : 'duplicate',
                insertType     : 'append',
                template       : 'previewButtons.duplicate',
                forAll         : true,
                forAllWithoutMy: false
            },
            {
                selector       : '#topButtons',
                elementId      : 'edit',
                insertType     : 'append',
                template       : 'previewButtons.edit',
                forAll         : true,
                forAllWithoutMy: false
            }
        ]
    },
    10           : {
        preview: [
            {
                selector       : '#topButtons',
                elementId      : 'brandingAndDisplayItems',
                insertType     : 'append',
                template       : 'previewButtons.table',
                forAll         : true,
                forAllWithoutMy: false
            }
        ]
    },

    activityList: {
        preview: [
            {
                selector       : '#topButtons',
                elementId      : 'brandingAndDisplayItems',
                insertType     : 'append',
                template       : 'previewButtons.table',
                forAll         : true,
                forAllWithoutMy: false
            },
            {
                selector       : '#topButtons',
                insertType     : 'append',
                elementId      : 'goToBtn',
                template       : 'previewButtons.goTo',
                forAll         : true,
                forAllWithoutMy: false
            }
        ]
    }
};

var promotionsConfig = {
    1           : {
        preview: [
            {
                selector       : '#topButtons',
                elementId      : 'promotionsItems',
                insertType     : 'append',
                template       : 'previewButtons.table',
                forAll         : true,
                forAllWithoutMy: false
            },
            {
                selector       : '#topButtons',
                elementId      : 'duplicate',
                insertType     : 'append',
                template       : 'previewButtons.duplicate',
                forAll         : true,
                forAllWithoutMy: false
            },
            {
                selector       : '#topButtons',
                elementId      : 'edit',
                insertType     : 'append',
                template       : 'previewButtons.edit',
                forAll         : true,
                forAllWithoutMy: false
            }
        ]
    },
    2           : {
        preview: [
            {
                selector       : '#topButtons',
                elementId      : 'promotionsItems',
                insertType     : 'append',
                template       : 'previewButtons.table',
                forAll         : true,
                forAllWithoutMy: false
            }
        ]
    },
    activityList: {
        preview: [
            {
                selector       : '#topButtons',
                elementId      : 'promotionsItems',
                insertType     : 'append',
                template       : 'previewButtons.table',
                forAll         : true,
                forAllWithoutMy: false
            },
            {
                selector       : '#topButtons',
                insertType     : 'append',
                elementId      : 'goToBtn',
                template       : 'previewButtons.goTo',
                forAll         : true,
                forAllWithoutMy: false
            }
        ]
    }
};

var competitorPromotionActivities = {
    1: {
        preview: [
            {
                selector       : '#topButtons',
                elementId      : 'edit',
                insertType     : 'append',
                template       : 'previewButtons.edit',
                forAll         : true,
                forAllWithoutMy: false
            },
            {
                selector       : '#topButtons',
                elementId      : 'delete',
                insertType     : 'append',
                template       : 'previewButtons.delete',
                forAll         : true,
                forAllWithoutMy: false
            }
        ]
    },
    2: {
        preview: [
            {
                selector       : '#topButtons',
                elementId      : 'edit',
                insertType     : 'append',
                template       : 'previewButtons.edit',
                forAll         : true,
                forAllWithoutMy: false
            },
            {
                selector       : '#topButtons',
                elementId      : 'delete',
                insertType     : 'append',
                template       : 'previewButtons.delete',
                forAll         : true,
                forAllWithoutMy: false
            }
        ]
    },
    8: {
        preview: [
            {
                selector       : '#topButtons',
                elementId      : 'edit',
                insertType     : 'append',
                template       : 'previewButtons.edit',
                forAll         : true,
                forAllWithoutMy: false
            },
            {
                selector       : '#topButtons',
                elementId      : 'delete',
                insertType     : 'append',
                template       : 'previewButtons.delete',
                forAll         : true,
                forAllWithoutMy: false
            }
        ]
    },
    9: {
        preview: [
            {
                selector       : '#topButtons',
                elementId      : 'edit',
                insertType     : 'append',
                template       : 'previewButtons.edit',
                forAll         : true,
                forAllWithoutMy: false
            },
            {
                selector       : '#topButtons',
                elementId      : 'delete',
                insertType     : 'append',
                template       : 'previewButtons.delete',
                forAll         : true,
                forAllWithoutMy: false
            }
        ]
    },
    activityList: {
        preview: [
            {
                selector       : '#topButtons',
                insertType     : 'append',
                elementId      : 'goToBtn',
                template       : 'previewButtons.goTo',
                forAll         : true,
                forAllWithoutMy: false
            }
        ]
    }
};

var competitorBrandingAndDisplayConfig = {
    1: {
        preview: [
            {
                selector       : '#topButtons',
                elementId      : 'edit',
                insertType     : 'append',
                template       : 'previewButtons.edit',
                forAll         : true,
                forAllWithoutMy: false
            },
            {
                selector       : '#topButtons',
                elementId      : 'delete',
                insertType     : 'append',
                template       : 'previewButtons.delete',
                forAll         : true,
                forAllWithoutMy: false
            }
        ],
    },
    2: {
        preview: [
            {
                selector       : '#topButtons',
                elementId      : 'edit',
                insertType     : 'append',
                template       : 'previewButtons.edit',
                forAll         : true,
                forAllWithoutMy: false
            },
            {
                selector       : '#topButtons',
                elementId      : 'delete',
                insertType     : 'append',
                template       : 'previewButtons.delete',
                forAll         : true,
                forAllWithoutMy: false
            }
        ],
    },
    8: {
        preview: [
            {
                selector       : '#topButtons',
                elementId      : 'edit',
                insertType     : 'append',
                template       : 'previewButtons.edit',
                forAll         : true,
                forAllWithoutMy: false
            },
            {
                selector       : '#topButtons',
                elementId      : 'delete',
                insertType     : 'append',
                template       : 'previewButtons.delete',
                forAll         : true,
                forAllWithoutMy: false
            }
        ],
    },
    9: {
        preview: [
            {
                selector       : '#topButtons',
                elementId      : 'edit',
                insertType     : 'append',
                template       : 'previewButtons.edit',
                forAll         : true,
                forAllWithoutMy: false
            },
            {
                selector       : '#topButtons',
                elementId      : 'delete',
                insertType     : 'append',
                template       : 'previewButtons.delete',
                forAll         : true,
                forAllWithoutMy: false
            }
        ],
    },
    activityList: {
        preview: [
            {
                selector       : '#topButtons',
                insertType     : 'append',
                elementId      : 'goToBtn',
                template       : 'previewButtons.goTo',
                forAll         : true,
                forAllWithoutMy: false
            }
        ]
    }
};

var achievementFormConfig = {
    1: {
        preview: [
            {
                selector       : '#topButtons',
                elementId      : 'edit',
                insertType     : 'append',
                template       : 'previewButtons.edit',
                forAll         : true,
                forAllWithoutMy: false
            },
            {
                selector       : '#topButtons',
                elementId      : 'delete',
                insertType     : 'append',
                template       : 'previewButtons.delete',
                forAll         : true,
                forAllWithoutMy: false
            }
        ],
    },
    2: {
        preview: [
            {
                selector       : '#topButtons',
                elementId      : 'edit',
                insertType     : 'append',
                template       : 'previewButtons.edit',
                forAll         : true,
                forAllWithoutMy: false
            },
            {
                selector       : '#topButtons',
                elementId      : 'delete',
                insertType     : 'append',
                template       : 'previewButtons.delete',
                forAll         : true,
                forAllWithoutMy: false
            }
        ],
    },
    8: {
        preview: [
            {
                selector       : '#topButtons',
                elementId      : 'edit',
                insertType     : 'append',
                template       : 'previewButtons.edit',
                forAll         : true,
                forAllWithoutMy: false
            },
            {
                selector       : '#topButtons',
                elementId      : 'delete',
                insertType     : 'append',
                template       : 'previewButtons.delete',
                forAll         : true,
                forAllWithoutMy: false
            }
        ],
    },
    9: {
        preview: [
            {
                selector       : '#topButtons',
                elementId      : 'edit',
                insertType     : 'append',
                template       : 'previewButtons.edit',
                forAll         : true,
                forAllWithoutMy: false
            },
            {
                selector       : '#topButtons',
                elementId      : 'delete',
                insertType     : 'append',
                template       : 'previewButtons.delete',
                forAll         : true,
                forAllWithoutMy: false
            }
        ],
    },
    activityList: {
        preview: [
            {
                selector       : '#topButtons',
                insertType     : 'append',
                elementId      : 'goToBtn',
                template       : 'previewButtons.goTo',
                forAll         : true,
                forAllWithoutMy: false
            }
        ]
    }
};

var newProductLunchConfig = {
    1: {
        preview: [
            {
                selector       : '#topButtons',
                elementId      : 'edit',
                insertType     : 'append',
                template       : 'previewButtons.edit',
                forAll         : true,
                forAllWithoutMy: false
            },
            {
                selector       : '#topButtons',
                elementId      : 'delete',
                insertType     : 'append',
                template       : 'previewButtons.delete',
                forAll         : true,
                forAllWithoutMy: false
            }
        ],
    },
    2: {
        preview: [
            {
                selector       : '#topButtons',
                elementId      : 'edit',
                insertType     : 'append',
                template       : 'previewButtons.edit',
                forAll         : true,
                forAllWithoutMy: false
            },
            {
                selector       : '#topButtons',
                elementId      : 'delete',
                insertType     : 'append',
                template       : 'previewButtons.delete',
                forAll         : true,
                forAllWithoutMy: false
            }
        ],
    },
    8: {
        preview: [
            {
                selector       : '#topButtons',
                elementId      : 'edit',
                insertType     : 'append',
                template       : 'previewButtons.edit',
                forAll         : true,
                forAllWithoutMy: false
            },
            {
                selector       : '#topButtons',
                elementId      : 'delete',
                insertType     : 'append',
                template       : 'previewButtons.delete',
                forAll         : true,
                forAllWithoutMy: false
            }
        ],
    },
    9: {
        preview: [
            {
                selector       : '#topButtons',
                elementId      : 'edit',
                insertType     : 'append',
                template       : 'previewButtons.edit',
                forAll         : true,
                forAllWithoutMy: false
            },
            {
                selector       : '#topButtons',
                elementId      : 'delete',
                insertType     : 'append',
                template       : 'previewButtons.delete',
                forAll         : true,
                forAllWithoutMy: false
            }
        ],
    },
    activityList: {
        preview: [
            {
                selector       : '#topButtons',
                insertType     : 'append',
                elementId      : 'goToBtn',
                template       : 'previewButtons.goTo',
                forAll         : true,
                forAllWithoutMy: false
            }
        ]
    }
};

var brandingAndMonthlyDisplayConfig = {
    1: {
        preview: [
            {
                selector       : '#topButtons',
                elementId      : 'edit',
                insertType     : 'append',
                template       : 'previewButtons.edit',
                forAll         : true,
                forAllWithoutMy: false
            },
            {
                selector       : '#topButtons',
                elementId      : 'delete',
                insertType     : 'append',
                template       : 'previewButtons.delete',
                forAll         : true,
                forAllWithoutMy: false
            }
        ],
    },
    2: {
        preview: [
            {
                selector       : '#topButtons',
                elementId      : 'edit',
                insertType     : 'append',
                template       : 'previewButtons.edit',
                forAll         : true,
                forAllWithoutMy: false
            },
            {
                selector       : '#topButtons',
                elementId      : 'delete',
                insertType     : 'append',
                template       : 'previewButtons.delete',
                forAll         : true,
                forAllWithoutMy: false
            }
        ],
    },
    8: {
        preview: [
            {
                selector       : '#topButtons',
                elementId      : 'edit',
                insertType     : 'append',
                template       : 'previewButtons.edit',
                forAll         : true,
                forAllWithoutMy: false
            },
            {
                selector       : '#topButtons',
                elementId      : 'delete',
                insertType     : 'append',
                template       : 'previewButtons.delete',
                forAll         : true,
                forAllWithoutMy: false
            }
        ],
    },
    9: {
        preview: [
            {
                selector       : '#topButtons',
                elementId      : 'edit',
                insertType     : 'append',
                template       : 'previewButtons.edit',
                forAll         : true,
                forAllWithoutMy: false
            },
            {
                selector       : '#topButtons',
                elementId      : 'delete',
                insertType     : 'append',
                template       : 'previewButtons.delete',
                forAll         : true,
                forAllWithoutMy: false
            }
        ],
    },
    activityList: {
        preview: [
            {
                selector       : '#topButtons',
                insertType     : 'append',
                elementId      : 'goToBtn',
                template       : 'previewButtons.goTo',
                forAll         : true,
                forAllWithoutMy: false
            }
        ]
    }
};

var defaultActivityListGoToButton = {
    activityList: {
        preview: [
            {
                selector       : '#topButtons',
                insertType     : 'append',
                elementId      : 'goToBtn',
                template       : 'previewButtons.goTo',
                forAll         : true,
                forAllWithoutMy: false
            }
        ]
    }
};

config[CONTENT_TYPES.OBJECTIVES] = objectivesConfig;
config[CONTENT_TYPES.INSTORETASKS] = inStoreTasksConfig;
config[CONTENT_TYPES.DOCUMENTS] = documentsConfig;
config[CONTENT_TYPES.NOTES] = notesConfig;
config[CONTENT_TYPES.CONTRACTSSECONDARY] = contractsSecondaryConfig;
config[CONTENT_TYPES.CONTRACTSYEARLY] = contractsYearlyConfig;
config[CONTENT_TYPES.QUESTIONNARIES] = questionaryConfig;
config[CONTENT_TYPES.MARKETING_CAMPAIGN] = brandingAndDisplayConfig;
config[CONTENT_TYPES.PROMOTIONS] = promotionsConfig;
config[CONTENT_TYPES.CONSUMER_SURVEY] = consumersSurveyConfig;
config[CONTENT_TYPES.COMPETITORPROMOTION] = competitorPromotionActivities;
config[CONTENT_TYPES.COMPETITORBRANDING] = competitorBrandingAndDisplayConfig;
config[CONTENT_TYPES.ACHIEVEMENTFORM] = achievementFormConfig;
config[CONTENT_TYPES.NEWPRODUCTLAUNCH] = newProductLunchConfig;
config[CONTENT_TYPES.BRANDING_AND_MONTHLY_DISPLAY] = brandingAndMonthlyDisplayConfig;
config[CONTENT_TYPES.NOTIFICATIONS] = defaultActivityListGoToButton;

module.exports = config;
