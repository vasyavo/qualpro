const ACL_MODULES = require('./../../constants/aclModulesNames');

module.exports = [
    {
        module: ACL_MODULES.ACTIVITY_LIST,
        cms: {
            archive: false,
            edit: false,
            write: false,
            read: true
        },
        mobile: {
            archive: false,
            edit: false,
            write: false,
            read: true
        }
    }, {
        module: ACL_MODULES.LOCATIONS,
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
        module: ACL_MODULES.COUNTRY,
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
            read: true
        }
    }, {
        module: ACL_MODULES.CUSTOMER,
        cms: {
            archive: false,
            edit: false,
            write: false,
            read: true
        },
        mobile: {
            archive: false,
            edit: false,
            write: false,
            read: true
        }
    }, {
        module: ACL_MODULES.TRADE_CHANNEL,
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
            read: true
        }
    }, {
        module: ACL_MODULES.PERSONNEL,
        cms: {
            archive: false,
            edit: true,
            write: false,
            read: true,
            evaluate: true
        },
        mobile: {
            archive: false,
            edit: true,
            write: false,
            read: true
        }
    }, {
        module: ACL_MODULES.OBJECTIVE,
        cms: {
            archive: false,
            edit: false,
            write: false,
            read: true
        },
        mobile: {
            archive: false,
            edit: true,
            write: false,
            read: true
        }
    }, {
        module: ACL_MODULES.ITEMS_AND_PRICES,
        cms: {
            archive: false,
            edit: false,
            write: false,
            read: true
        },
        mobile: {
            archive: false,
            edit: false,
            write: false,
            read: true
        }
    }, {
        module: ACL_MODULES.PLANOGRAM,
        cms: {
            archive: false,
            edit: false,
            write: false,
            read: true
        },
        mobile: {
            archive: false,
            edit: false,
            write: false,
            read: true
        }
    }, {
        module: ACL_MODULES.COMPETITOR_LIST,
        cms: {
            archive: false,
            edit: false,
            write: false,
            read: true
        },
        mobile: {
            archive: false,
            edit: false,
            write: false,
            read: true
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
            read: true
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
            read: true
        }
    }, {
        module: ACL_MODULES.REPORTING,
        cms: {
            archive: false,
            edit: true,
            write: true,
            read: false
        },
        mobile: {
            archive: false,
            edit: true,
            write: true,
            read: true
        }
    }, {
        module: ACL_MODULES.AL_ALALI_MARKETING,
        cms: {
            archive: false,
            edit: true,
            write: true,
            read: false
        },
        mobile: {
            archive: false,
            edit: true,
            write: true,
            read: false
        }
    }, {
        module: ACL_MODULES.OBJECTIVES_AND_TASKS_FORM,
        cms: {
            archive: false,
            edit: true,
            write: true,
            read: false
        },
        mobile: {
            archive: false,
            edit: true,
            write: true,
            read: false
        }
    }, {
        module: ACL_MODULES.IN_STORE_REPORTING,
        cms: {
            archive: false,
            edit: false,
            write: false,
            read: true
        },
        mobile: {
            archive: false,
            edit: true,
            write: false,
            read: true
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
            edit: true,
            write: true,
            read: true
        }
    }, {
        module: ACL_MODULES.CONTRACT_YEARLY_AND_VISIBILITY,
        cms: {
            upload: false,
            edit: false,
            write: false,
            read: false
        },
        mobile: {
            upload: false,
            edit: false,
            write: false,
            read: true
        }
    }, {
        module: ACL_MODULES.VISIBILITY,
        cms: {
            upload: false,
            edit: false,
            write: false,
            read: true
        },
        mobile: {
            upload: false,
            edit: false,
            write: false,
            read: true
        }
    }, {
        module: ACL_MODULES.CONTRACT_SECONDARY,
        cms: {
            upload: false,
            edit: false,
            write: false,
            read: false
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
            write: false,
            read: false
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
            archive: true,
            edit: true,
            write: true,
            read: true
        }
    }, {
        module: ACL_MODULES.NOTIFICATION,
        cms: {
            edit: false,
            write: false,
            read: true
        },
        mobile: {
            edit: false,
            write: false,
            read: true
        }
    }, {
        module: ACL_MODULES.SETTINGS,
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
        module: ACL_MODULES.LOGIN_CREDENTIALS,
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
        module: ACL_MODULES.COMPETITOR_PROMOTION_ACTIVITY,
        cms: {
            archive: false,
            edit: false,
            write: false,
            read: false
        },
        mobile: {
            archive: false,
            edit: false,
            write: true,
            read: true
        }
    }, {
        module: ACL_MODULES.AL_ALALI_PROMO_EVALUATION,
        cms: {
            archive: false,
            edit: true,
            write: true,
            read: false
        },
        mobile: {
            archive: false,
            edit: true,
            write: true,
            read: false
        }
    },
    {
        module: ACL_MODULES.COMPETITOR_BRANDING_DISPLAY_REPORT,
        cms: {
            archive: false,
            edit: false,
            write: false,
            read: false
        },
        mobile: {
            archive: false,
            edit: false,
            write: true,
            read: true
        }
    },
    {
        module: ACL_MODULES.AL_ALALI_PROMOTIONS_ITEMS,
        cms: {
            archive: false,
            edit: false,
            write: false,
            read: false
        },
        mobile: {
            archive: false,
            edit: true,
            write: true,
            read: true
        }
    },
    {
        module: ACL_MODULES.NEW_PRODUCT_LAUNCH,
        cms: {
            archive: false,
            edit: false,
            write: false,
            read: false
        },
        mobile: {
            archive: false,
            edit: false,
            write: true,
            read: true
        }
    },
    {
        module: ACL_MODULES.ACHIEVEMENT_FORM,
        cms: {
            archive: false,
            edit: false,
            write: false,
            read: false
        },
        mobile: {
            archive: false,
            edit: false,
            write: true,
            read: true
        }
    },
    {
        module: ACL_MODULES.AL_ALALI_BRANDING_ACTIVITY,
        cms: {
            archive: false,
            edit: false,
            write: false,
            read: false
        },
        mobile: {
            archive: false,
            edit: true,
            write: true,
            read: true
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
            write: true,
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
            upload: true,
            edit: true,
            write: true,
            read: true
        }
    },
    {
        module: ACL_MODULES.PRICE_SURVEY,
        cms: {
            archive: false,
            edit: false,
            write: true,
            read: false
        },
        mobile: {
            archive: false,
            edit: false,
            write: true,
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
            archive: true,
            edit: true,
            write: true,
            read: true
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
            write: true,
            read: true
        }
    },
    {
        module: ACL_MODULES.AL_ALALI_QUESTIONNAIRE,
        cms: {
            archive: false,
            edit: false,
            write: false,
            read: true
        },
        mobile: {
            archive: false,
            edit: true,
            write: false,
            read: true
        }
    },
    {
        module: ACL_MODULES.CONTACT_US,
        cms: {
            archive: false,
            edit: false,
            write: false,
            read: false
        },
        mobile: {
            archive: false,
            edit: false,
            write: true,
            read: false
        }
    }, {
        module: ACL_MODULES.CONSUMER_SURVEY,
        cms: {
            archive: false,
            edit: false,
            write: false,
            read: false
        },
        mobile: {
            archive: false,
            edit: true,
            write: false,
            read: true
        }
    },
    {
        module: ACL_MODULES.AL_ALALI_BRANDING_DISPLAY_REPORT,
        cms: {
            archive: false,
            edit: false,
            write: false,
            read: false
        },
        mobile: {
            archive: false,
            edit: false,
            write: true,
            read: false
        }
    }
];
