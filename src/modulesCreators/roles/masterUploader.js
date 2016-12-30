const ACL_MODULES = require('./../../constants/aclModulesNames');

module.exports = [
    {
        module: 1,
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
        module: 2,
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
        module: 3,
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
        module: 4,
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
        module: 5,
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
        module: 6,
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
            read: true
        }
    }, {
        module: 7,
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
        module: 10,
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
        module: 11,
        cms: {
            archive: true,
            edit: true,
            write: true,
            read: true
        },
        mobile: {
            archive: false,
            edit: true,
            write: true,
            read: true
        }
    }, {
        module: 12,
        cms: {
            archive: true,
            edit: true,
            write: false,
            read: true
        },
        mobile: {
            archive: true,
            edit: true,
            write: false,
            read: true
        }
    }, {
        module: 13,
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
        module: 14,
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
        module: 15,
        cms: {
            archive: false,
            edit: true,
            write: true,
            read: true
        },
        mobile: {
            archive: false,
            edit: true,
            write: true,
            read: true
        }
    }, {
        module: 16,
        cms: {
            archive: false,
            edit: true,
            write: true,
            read: true
        },
        mobile: {
            archive: false,
            edit: true,
            write: true,
            read: true
        }
    }, {
        module: 17,
        cms: {
            archive: false,
            edit: true,
            write: true,
            read: true
        },
        mobile: {
            archive: false,
            edit: true,
            write: true,
            read: true
        }
    }, {
        module: 18,
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
        module: 19,
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
        module: 20,
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
        module: 21,
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
            read: true
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
            edit: true,
            write: true,
            read: true
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
            archive: true,
            edit: true,
            write: true,
            read: true
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
            read: true
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
            archive: true,
            edit: true,
            write: true,
            read: true
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
            archive: true,
            edit: true,
            write: true,
            read: true
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
            archive: true,
            edit: true,
            write: true,
            read: true
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
            archive: true,
            edit: true,
            write: true,
            read: true
        }
    },
    {
        module: ACL_MODULES.COMPETITOR_PROMOTION_ACTIVITY,
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
        module: ACL_MODULES.AL_ALALI_PROMO_EVALUATION,
        cms: {
            archive: false,
            edit: true,
            write: true,
            read: true
        },
        mobile: {
            archive: false,
            edit: true,
            write: true,
            read: true
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
            edit: true,
            write: true,
            read: true
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
            archive: true,
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
            edit: false,
            write: true,
            read: true
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
            write: true,
            read: true
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
        module: 103,
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
        module: 104,
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
        module: 105,
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
        module: 31,
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
            write: true,
            read: false
        }
    },
    require('./../../stories/consumer-survey/acl/masterUploader'),
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
            write: true,
            read: false
        }
    }
];
