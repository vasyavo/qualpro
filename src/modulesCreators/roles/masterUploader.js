const ACL_MODULES = require('./../../constants/aclModulesNames');

module.exports = [
    {
        module: ACL_MODULES.ACTIVITY_LIST,
        cms: {
            archive: false,
            edit: false,
            write: false,
            read: false
        },
        mobile: {
            archive: false,
            edit: false,
            write: false,
            read: false
        }
    }, {
        module: ACL_MODULES.LOCATIONS,
        cms: {
            archive: true,
            edit: true,
            write: true,
            read: true
        },
        mobile: {
            archive: false,
            edit: false,
            write: false,
            read: false
        }
    }, {
        module: ACL_MODULES.COUNTRY,
        cms: {
            archive: true,
            edit: true,
            write: true,
            read: true
        },
        mobile: {
            archive: false,
            edit: false,
            write: false,
            read: false
        }
    }, {
        module: ACL_MODULES.CUSTOMER,
        cms: {
            archive: true,
            edit: true,
            write: true,
            read: true
        },
        mobile: {
            archive: false,
            edit: false,
            write: false,
            read: false
        }
    }, {
        module: ACL_MODULES.TRADE_CHANNEL,
        cms: {
            archive: true,
            edit: true,
            write: true,
            read: true
        },
        mobile: {
            archive: false,
            edit: false,
            write: false,
            read: false
        }
    }, {
        module: ACL_MODULES.PERSONNEL,
        cms: {
            archive: true,
            edit: true,
            write: true,
            read: true,
            evaluate: false
        },
        mobile: {
            archive: false,
            edit: false,
            write: false,
            read: false
        }
    }, {
        module: ACL_MODULES.OBJECTIVE,
        cms: {
            archive: false,
            edit: false,
            write: false,
            read: false
        },
        mobile: {
            archive: false,
            edit: false,
            write: false,
            read: false
        }
    }, {
        module: ACL_MODULES.VISIBILITY_FORM,
        cms   : {
            archive: false,
            edit: false,
            write: false,
            read: false
        },
        mobile: {
            archive: false,
            edit: false,
            write: false,
            read: false
        }
    }, {
        module: ACL_MODULES.ITEMS_AND_PRICES,
        cms: {
            archive: true,
            edit: true,
            write: true,
            read: true
        },
        mobile: {
            archive: false,
            edit: false,
            write: false,
            read: false
        }
    }, {
        module: ACL_MODULES.PLANOGRAM,
        cms: {
            archive: true,
            edit: true,
            write: true,
            read: true
        },
        mobile: {
            archive: false,
            edit: false,
            write: false,
            read: false
        }
    }, {
        module: ACL_MODULES.COMPETITOR_LIST,
        cms: {
            archive: true,
            edit: true,
            write: false,
            read: true
        },
        mobile: {
            archive: false,
            edit: false,
            write: false,
            read: false
        }
    }, {
        module: ACL_MODULES.PROFILE,
        cms: {
            archive: true,
            edit: true,
            write: true,
            read: true
        },
        mobile: {
            archive: false,
            edit: false,
            write: false,
            read: false
        }
    }, {
        module: ACL_MODULES.PERFORMANCE,
        cms: {
            archive: false,
            edit: true,
            write: true,
            read: true
        },
        mobile: {
            archive: false,
            edit: false,
            write: false,
            read: false
        }
    }, {
        module: ACL_MODULES.REPORTING,
        cms: {
            archive: false,
            edit: true,
            write: true,
            read: true
        },
        mobile: {
            archive: false,
            edit: false,
            write: false,
            read: false
        }
    }, {
        module: ACL_MODULES.AL_ALALI_MARKETING,
        cms: {
            archive: false,
            edit: true,
            write: true,
            read: true
        },
        mobile: {
            archive: false,
            edit: false,
            write: false,
            read: false
        }
    }, {
        module: ACL_MODULES.OBJECTIVES_AND_TASKS_FORM,
        cms: {
            archive: false,
            edit: true,
            write: true,
            read: true
        },
        mobile: {
            archive: false,
            edit: false,
            write: false,
            read: false
        }
    }, {
        module: ACL_MODULES.IN_STORE_REPORTING,
        cms: {
            archive: false,
            edit: false,
            write: false,
            read: false
        },
        mobile: {
            archive: false,
            edit: false,
            write: false,
            read: false
        }
    }, {
        module: ACL_MODULES.CONTRACT,
        cms: {
            upload: true,
            edit: true,
            write: true,
            read: true
        },
        mobile: {
            upload: false,
            edit: false,
            write: false,
            read: false
        }
    }, {
        module: ACL_MODULES.CONTRACT_YEARLY_AND_VISIBILITY,
        cms: {
            upload: true,
            edit: true,
            write: true,
            read: true
        },
        mobile: {
            upload: false,
            edit: false,
            write: false,
            read: false
        }
    }, {
        module: ACL_MODULES.VISIBILITY,
        cms: {
            upload: true,
            edit: false,
            write: false,
            read: true
        },
        mobile: {
            upload: false,
            edit: false,
            write: false,
            read: false
        }
    }, {
        module: ACL_MODULES.CONTRACT_SECONDARY,
        cms: {
            upload: true,
            edit: true,
            write: true,
            read: true
        },
        mobile: {
            upload: false,
            edit: false,
            write: false,
            read: false
        }
    }, {
        module: ACL_MODULES.EMPLOYEES_PERFORMANCE,
        cms: {
            edit: false,
            write: false,
            read: false
        },
        mobile: {
            edit: false,
            write: false,
            read: false
        }
    }, {
        module: ACL_MODULES.CUSTOM_REPORT,
        cms: {
            edit: false,
            write: true,
            read: true
        },
        mobile: {
            edit: false,
            write: false,
            read: false
        }
    }, {
        module: ACL_MODULES.NOTE,
        cms: {
            archive: true,
            edit: true,
            write: true,
            read: true
        },
        mobile: {
            archive: false,
            edit: false,
            write: false,
            read: false
        }
    }, {
        module: ACL_MODULES.NOTIFICATION,
        cms: {
            edit: true,
            write: true,
            read: true
        },
        mobile: {
            edit: false,
            write: false,
            read: false
        }
    }, {
        module: ACL_MODULES.SETTINGS,
        cms: {
            archive: true,
            edit: true,
            write: true,
            read: true
        },
        mobile: {
            archive: false,
            edit: false,
            write: false,
            read: false
        }
    }, {
        module: ACL_MODULES.LOGIN_CREDENTIALS,
        cms: {
            archive: true,
            edit: true,
            write: true,
            read: true
        },
        mobile: {
            archive: false,
            edit: false,
            write: false,
            read: false
        }
    }, {
        module: ACL_MODULES.AL_ALALI_QUESTIONNAIRE,
        cms: {
            archive: true,
            edit: true,
            write: true,
            read: true
        },
        mobile: {
            archive: false,
            edit: false,
            write: false,
            read: false
        }
    }, {
        module: 30,
        cms: {
            archive: true,
            edit: true,
            write: true,
            read: true
        },
        mobile: {
            archive: false,
            edit: false,
            write: false,
            read: false
        }
    },
    {
        module: ACL_MODULES.COMPETITOR_PROMOTION_ACTIVITY,
        cms: {
            archive: false,
            edit: false,
            write: true,
            read: true
        },
        mobile: {
            archive: false,
            edit: false,
            write: false,
            read: false
        }
    },
    {
        module: ACL_MODULES.AL_ALALI_PROMO_EVALUATION,
        cms: {
            archive: false,
            edit: true,
            write: true,
            read: true
        },
        mobile: {
            archive: false,
            edit: false,
            write: false,
            read: false
        }
    },
    {
        module: ACL_MODULES.COMPETITOR_BRANDING_DISPLAY_REPORT,
        cms: {
            archive: false,
            edit: true,
            write: true,
            read: true
        },
        mobile: {
            archive: false,
            edit: false,
            write: false,
            read: false
        }
    },
    {
        module: ACL_MODULES.AL_ALALI_PROMOTIONS_ITEMS,
        cms: {
            archive: true,
            edit: true,
            write: true,
            read: true
        },
        mobile: {
            archive: false,
            edit: false,
            write: false,
            read: false
        }
    },
    {
        module: ACL_MODULES.NEW_PRODUCT_LAUNCH,
        cms: {
            archive: false,
            edit: false,
            write: true,
            read: true
        },
        mobile: {
            archive: false,
            edit: false,
            write: false,
            read: false
        }
    },
    {
        module: ACL_MODULES.ACHIEVEMENT_FORM,
        cms: {
            archive: false,
            edit: false,
            write: true,
            read: true
        },
        mobile: {
            archive: false,
            edit: false,
            write: false,
            read: false
        }
    },
    {
        module: ACL_MODULES.AL_ALALI_BRANDING_ACTIVITY,
        cms: {
            archive: false,
            edit: true,
            write: true,
            read: true
        },
        mobile: {
            archive: false,
            edit: false,
            write: false,
            read: false
        }
    },
    {
        module: ACL_MODULES.SHELF_SHARES,
        cms: {
            archive: false,
            edit: false,
            write: false,
            read: false
        },
        mobile: {
            archive: false,
            edit: false,
            write: false,
            read: false
        }
    },
    {
        module: ACL_MODULES.PRICE_SURVEY,
        cms: {
            archive: false,
            edit: false,
            write: true,
            read: true
        },
        mobile: {
            archive: false,
            edit: false,
            write: false,
            read: false
        }
    },
    {
        module: ACL_MODULES.AL_ALALI_BRANDING_ACTIVITY_ITEMS,
        cms: {
            upload: true,
            edit: true,
            write: true,
            read: true
        },
        mobile: {
            upload: false,
            edit: false,
            write: false,
            read: false
        }
    },
    {
        module: ACL_MODULES.DOCUMENT,
        cms: {
            archive: true,
            edit: true,
            write: true,
            read: true
        },
        mobile: {
            archive: false,
            edit: false,
            write: false,
            read: true
        }
    },
    {
        module: ACL_MODULES.REGION,
        cms: {
            archive: true,
            edit: true,
            write: true,
            read: true
        },
        mobile: {
            archive: false,
            edit: false,
            write: false,
            read: false
        }
    },
    {
        module: ACL_MODULES.SUB_REGION,
        cms: {
            archive: true,
            edit: true,
            write: true,
            read: true
        },
        mobile: {
            archive: false,
            edit: false,
            write: false,
            read: false
        }
    },
    {
        module: ACL_MODULES.BRANCH,
        cms: {
            archive: true,
            edit: true,
            write: true,
            read: true
        },
        mobile: {
            archive: false,
            edit: false,
            write: false,
            read: false
        }
    },
    {
        module: ACL_MODULES.COMMENT,
        cms: {
            archive: false,
            edit: false,
            write: true,
            read: true
        },
        mobile: {
            archive: false,
            edit: false,
            write: false,
            read: false
        }
    },
    {
        module: ACL_MODULES.AL_ALALI_QUESTIONNAIRE,
        cms: {
            archive: false,
            edit: true,
            write: true,
            read: true
        },
        mobile: {
            archive: false,
            edit: false,
            write: false,
            read: false
        }
    },
    {
        module: ACL_MODULES.CONTACT_US,
        cms: {
            archive: false,
            edit: true,
            write: false,
            read: true
        },
        mobile: {
            archive: false,
            edit: false,
            write: false,
            read: false
        }
    },
    require('./../../stories/consumersSurvey/acl/masterUploader'),
    {
        module: ACL_MODULES.AL_ALALI_BRANDING_DISPLAY_REPORT,
        cms: {
            archive: false,
            edit: true,
            write: true,
            read: true
        },
        mobile: {
            archive: false,
            edit: false,
            write: false,
            read: false
        }
    }
];
