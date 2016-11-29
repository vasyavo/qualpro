'use strict';

const async = require('async');
const logger = require('../utils/logger');
const AccessRoleModel = require('../types/accessRole/model');

var ACL_MODULES = require('../constants/aclModulesNames');
const commentsAccess = {
    module: 1010,
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
};

const superAdmin = [
{
    module: 1,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 2,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 3,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 4,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 5,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 6,
    cms   : {
        archive : true,
        edit    : true,
        write   : true,
        read    : true,
        evaluate: false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 7,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 10,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 11,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 12,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : false,
        read   : true
    }
}, {
    module: 13,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 14,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 15,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 16,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 31,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 17,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 18,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 19,
    cms   : {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : true,
        write : true,
        read  : true
    }
}, {
    module: 20,
    cms   : {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : true,
        write : true,
        read  : true
    }
}, {
    module: 21,
    cms   : {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : true,
        write : true,
        read  : true
    }
}, {
    module: ACL_MODULES.CONTRACT_SECONDARY,
    cms   : {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : true,
        write : true,
        read  : true
    }
}, {
    module: ACL_MODULES.EMPLOYEES_PERFORMANCE,
    cms   : {
        edit : true,
        write: true,
        read : true
    },
    mobile: {
        edit : true,
        write: true,
        read : true
    }
}, {
    module: ACL_MODULES.CUSTOM_REPORT,
    cms   : {
        edit : false,
        write: true,
        read : true
    },
    mobile: {
        edit : false,
        write: false,
        read : false
    }
}, {
    module: ACL_MODULES.NOTE,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: ACL_MODULES.NOTIFICATION,
    cms   : {
        edit : true,
        write: true,
        read : true
    },
    mobile: {
        edit : false,
        write: false,
        read : true
    }
}, {
    module: ACL_MODULES.SETTINGS,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: ACL_MODULES.LOGIN_CREDENTIALS,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: ACL_MODULES.AL_ALALI_QUESTIONNAIRE,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 30,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: ACL_MODULES.COMPETITOR_PROMOTION_ACTIVITY,
    cms   : {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
}, {
    module: ACL_MODULES.AL_ALALI_PROMO_EVALUATION,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
},
{
    module: ACL_MODULES.COMPETITOR_BRANDING_DISPLAY_REPORT,
    cms   : {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
},
{
    module: ACL_MODULES.AL_ALALI_PROMOTIONS_ITEMS,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
},
{
    module: ACL_MODULES.NEW_PRODUCT_LAUNCH,
    cms   : {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
},
{
    module: ACL_MODULES.ACHIEVEMENT_FORM,
    cms   : {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
},
{
    module: ACL_MODULES.AL_ALALI_BRANDING_ACTIVITY,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
},
{
    module: ACL_MODULES.SHELF_SHARES,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
},
{
    module: ACL_MODULES.PRICE_SURVEY,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
},
{
    module: ACL_MODULES.AL_ALALI_BRANDING_ACTIVITY_ITEMS,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
},
{
    module: 103,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 104,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 105,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
},
{
    module: ACL_MODULES.DOCUMENT,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
},
    {
        module: 43,
        cms   : {
            archive: false,
            edit   : true,
            write  : false,
            read   : true
        },
        mobile: {
            archive: false,
            edit   : false,
            write  : true,
            read   : false
        }
    },
    {
        module: 44,
        cms   : {
            archive: false,
            edit   : true,
            write  : false,
            read   : false
        },
        mobile: {
            archive: false,
            edit   : false,
            write  : true,
            read   : false
        }
    },
    {
        module: ACL_MODULES.AL_ALALI_BRANDING_DISPLAY_REPORT,
        cms   : {
            archive: false,
            edit   : true,
            write  : true,
            read   : true
        },
        mobile: {
            archive: false,
            edit   : false,
            write  : true,
            read   : false
        }
    },
    commentsAccess
];

const masterAdmin = [
{
    module: 1,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
},
{
    module: 2,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
},
{
    module: 3,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
},
{
    module: 4,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
},
{
    module: 5,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
},
{
    module: 6,
    cms   : {
        archive : true,
        edit    : true,
        write   : true,
        read    : true,
        evaluate: false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
},
{
    module: 7,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
},
{
    module: 10,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
},
{
    module: 11,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
},
{
    module: 12,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : false,
        read   : true
    }
},
{
    module: 13,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
},
{
    module: 14,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
},
{
    module: 15,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
},
{
    module: 16,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
},
{
    module: 31,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
},
{
    module: 17,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
},
{
    module: 18,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 19,
    cms   : {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : true,
        write : true,
        read  : true
    }
}, {
    module: 20,
    cms   : {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : true,
        write : true,
        read  : true
    }
}, {
    module: 21,
    cms   : {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : true,
        write : true,
        read  : true
    }
}, {
    module: ACL_MODULES.CONTRACT_SECONDARY,
    cms   : {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : true,
        write : true,
        read  : true
    }
}, {
    module: ACL_MODULES.EMPLOYEES_PERFORMANCE,
    cms   : {
        edit : true,
        write: true,
        read : true
    },
    mobile: {
        edit : true,
        write: true,
        read : true
    }
}, {
    module: ACL_MODULES.CUSTOM_REPORT,
    cms   : {
        edit : false,
        write: true,
        read : true
    },
    mobile: {
        edit : false,
        write: false,
        read : false
    }
}, {
    module: ACL_MODULES.NOTE,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: ACL_MODULES.NOTIFICATION,
    cms   : {
        edit : true,
        write: true,
        read : true
    },
    mobile: {
        edit : false,
        write: false,
        read : true
    }
}, {
    module: ACL_MODULES.SETTINGS,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: ACL_MODULES.LOGIN_CREDENTIALS,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: ACL_MODULES.AL_ALALI_QUESTIONNAIRE,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 30,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: ACL_MODULES.COMPETITOR_PROMOTION_ACTIVITY,
    cms   : {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
}, {
    module: ACL_MODULES.AL_ALALI_PROMO_EVALUATION,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
},
{
    module: ACL_MODULES.COMPETITOR_BRANDING_DISPLAY_REPORT,
    cms   : {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
},
{
    module: ACL_MODULES.AL_ALALI_PROMOTIONS_ITEMS,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
},
{
    module: ACL_MODULES.NEW_PRODUCT_LAUNCH,
    cms   : {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
},
{
    module: ACL_MODULES.ACHIEVEMENT_FORM,
    cms   : {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
},
{
    module: ACL_MODULES.AL_ALALI_BRANDING_ACTIVITY,
    cms   : {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : false,
        write : true,
        read  : true
    }
},
{
    module: ACL_MODULES.AL_ALALI_BRANDING_ACTIVITY_ITEMS,
    cms   : {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : false,
        write : true,
        read  : true
    }
},
{
    module: 1000,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
},
{
    module: 1001,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
},
{
    module: ACL_MODULES.SHELF_SHARES,
    cms   : {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
},
{
    module: ACL_MODULES.PRICE_SURVEY,
    cms   : {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
},
{
    module: 103,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
},
{
    module: 104,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
},
{
    module: 105,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
},
{
    module: ACL_MODULES.DOCUMENT,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
},
    {
        module: 43,
        cms   : {
            archive: false,
            edit   : true,
            write  : false,
            read   : true
        },
        mobile: {
            archive: false,
            edit   : false,
            write  : true,
            read   : false
        }
    }, {
        module: 44,
        cms   : {
            archive: false,
            edit   : true,
            write  : true,
            read   : false
        },
        mobile: {
            archive: false,
            edit   : false,
            write  : false,
            read   : true
        }
    },
    {
        module: ACL_MODULES.AL_ALALI_BRANDING_DISPLAY_REPORT,
        cms   : {
            archive: false,
            edit   : true,
            write  : true,
            read   : true
        },
        mobile: {
            archive: false,
            edit   : false,
            write  : true,
            read   : false
        }
    },commentsAccess
];

const countryAdmin = [
{
    module: 1,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 2,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 3,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 103,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 104,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 105,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 4,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 5,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 6,
    cms   : {
        archive : true,
        edit    : true,
        write   : true,
        read    : true,
        evaluate: false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 7,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 10,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 11,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 12,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : false,
        read   : true
    }
}, {
    module: 13,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 14,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 15,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 16,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 17,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 18,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 19,
    cms   : {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : true,
        write : true,
        read  : true
    }
}, {
    module: 20,
    cms   : {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : true,
        write : true,
        read  : true
    }
}, {
    module: 21,
    cms   : {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : true,
        write : true,
        read  : true
    }
}, {
    module: ACL_MODULES.CONTRACT_SECONDARY,
    cms   : {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : true,
        write : true,
        read  : true
    }
}, {
    module: ACL_MODULES.EMPLOYEES_PERFORMANCE,
    cms   : {
        edit : true,
        write: true,
        read : true
    },
    mobile: {
        edit : true,
        write: true,
        read : true
    }
}, {
    module: ACL_MODULES.CUSTOM_REPORT,
    cms   : {
        edit : false,
        write: true,
        read : true
    },
    mobile: {
        edit : false,
        write: false,
        read : false
    }
}, {
    module: ACL_MODULES.NOTE,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: ACL_MODULES.NOTIFICATION,
    cms   : {
        edit : true,
        write: true,
        read : true
    },
    mobile: {
        edit : false,
        write: false,
        read : true
    }
}, {
    module: ACL_MODULES.SETTINGS,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: ACL_MODULES.LOGIN_CREDENTIALS,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: ACL_MODULES.AL_ALALI_QUESTIONNAIRE,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 30,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
},
{
    module: ACL_MODULES.COMPETITOR_PROMOTION_ACTIVITY,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
}, {
    module: ACL_MODULES.AL_ALALI_PROMO_EVALUATION,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
},
{
    module: ACL_MODULES.COMPETITOR_BRANDING_DISPLAY_REPORT,
    cms   : {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
},
{
    module: ACL_MODULES.AL_ALALI_PROMOTIONS_ITEMS,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
},
{
    module: ACL_MODULES.NEW_PRODUCT_LAUNCH,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
},
{
    module: ACL_MODULES.ACHIEVEMENT_FORM,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
},
{
    module: ACL_MODULES.AL_ALALI_BRANDING_ACTIVITY,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
},
{
    module: ACL_MODULES.SHELF_SHARES,
    cms   : {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
},
{
    module: ACL_MODULES.PRICE_SURVEY,
    cms   : {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
},
{
    module: ACL_MODULES.AL_ALALI_BRANDING_ACTIVITY_ITEMS,
    cms   : {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : false,
        write : true,
        read  : true
    }
},
{
    module: ACL_MODULES.DOCUMENT,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
},
commentsAccess,
{
    module: 31,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
},
    {
        module: 43,
        cms   : {
            archive: false,
            edit   : true,
            write  : false,
            read   : true
        },
        mobile: {
            archive: false,
            edit   : false,
            write  : true,
            read   : false
        }
    }, {
        module: 44,
        cms   : {
            archive: false,
            edit   : true,
            write  : true,
            read   : false
        },
        mobile: {
            archive: false,
            edit   : false,
            write  : false,
            read   : true
        }
    },
    {
        module: ACL_MODULES.AL_ALALI_BRANDING_DISPLAY_REPORT,
        cms   : {
            archive: false,
            edit   : true,
            write  : false,
            read   : true
        },
        mobile: {
            archive: false,
            edit   : false,
            write  : true,
            read   : false
        }
    }
];

const areaFiledManager = [
{
    module: 1,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 2,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 3,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 4,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 5,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 6,
    cms   : {
        archive : false,
        edit    : true,
        write   : false,
        read    : true,
        evaluate: true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 7,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 10,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 11,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 12,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 13,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 14,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 15,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 16,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 17,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 18,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 19,
    cms   : {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : true,
        write : true,
        read  : true
    }
}, {
    module: 20,
    cms   : {
        upload: false,
        edit  : false,
        write : false,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : false,
        write : false,
        read  : true
    }
}, {
    module: 21,
    cms   : {
        upload: false,
        edit  : false,
        write : false,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : false,
        write : false,
        read  : true
    }
},
{
    module: ACL_MODULES.CONTRACT_SECONDARY,
    cms   : {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : true,
        write : true,
        read  : true
    }
},
{
    module: ACL_MODULES.EMPLOYEES_PERFORMANCE,
    cms   : {
        edit : false,
        write: true,
        read : true
    },
    mobile: {
        edit : false,
        write: true,
        read : true
    }
},
{
    module: ACL_MODULES.CUSTOM_REPORT,
    cms   : {
        edit : false,
        write: true,
        read : true
    },
    mobile: {
        edit : false,
        write: false,
        read : false
    }
},
{
    module: ACL_MODULES.NOTE,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
},
{
    module: ACL_MODULES.NOTIFICATION,
    cms   : {
        edit : true,
        write: true,
        read : true
    },
    mobile: {
        edit : false,
        write: false,
        read : true
    }
},
{
    module: ACL_MODULES.SETTINGS,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
},
{
    module: ACL_MODULES.LOGIN_CREDENTIALS,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
},
{
    module: 30,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
},
{
    module: ACL_MODULES.COMPETITOR_PROMOTION_ACTIVITY,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
},
{
    module: ACL_MODULES.AL_ALALI_PROMO_EVALUATION,
    cms   : {
        archive: false,
        edit   : true,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : false,
        read   : true
    }
},
{
    module: ACL_MODULES.COMPETITOR_BRANDING_DISPLAY_REPORT,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
},
{
    module: ACL_MODULES.AL_ALALI_PROMOTIONS_ITEMS,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
},
{
    module: ACL_MODULES.NEW_PRODUCT_LAUNCH,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
},
{
    module: ACL_MODULES.ACHIEVEMENT_FORM,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
},
{
    module: ACL_MODULES.AL_ALALI_BRANDING_ACTIVITY,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
},
{
    module: ACL_MODULES.SHELF_SHARES,
    cms   : {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
},
{
    module: ACL_MODULES.PRICE_SURVEY,
    cms   : {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
},
{
    module: ACL_MODULES.DOCUMENT,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
},
{
    module: ACL_MODULES.AL_ALALI_BRANDING_ACTIVITY_ITEMS,
    cms   : {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : false,
        write : true,
        read  : true
    }
},
commentsAccess,
{
    module: ACL_MODULES.AL_ALALI_QUESTIONNAIRE,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : false,
        read   : true
    }
},
{
    module: ACL_MODULES.CONTACT_US,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
            archive: false,
            edit   : false,
            write  : true,
            read   : false
        }
},
{
    module: ACL_MODULES.CONSUMER_SURVEY,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : false,
        read   : false
    }
},
{
    module: ACL_MODULES.AL_ALALI_BRANDING_DISPLAY_REPORT,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : false
    }
}
];

const areaInChargeManager = [
{
    module: 1,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 2,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
}, {
    module: 3,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 4,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 5,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 6,
    cms   : {
        archive : false,
        edit    : true,
        write   : false,
        read    : true,
        evaluate: true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : false,
        read   : true
    }
}, {
    module: 7,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 10,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 11,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 12,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 13,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 14,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 15,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 16,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 17,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 18,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 19,
    cms   : {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : true,
        write : true,
        read  : true
    }
}, {
    module: 20,
    cms   : {
        upload: false,
        edit  : false,
        write : false,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : false,
        write : false,
        read  : true
    }
}, {
    module: 21,
    cms   : {
        upload: false,
        edit  : false,
        write : false,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : false,
        write : false,
        read  : true
    }
}, {
    module: ACL_MODULES.CONTRACT_SECONDARY,
    cms   : {
        upload: false,
        edit  : false,
        write : false,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : false,
        write : false,
        read  : true
    }
}, {
    module: ACL_MODULES.EMPLOYEES_PERFORMANCE,
    cms   : {
        edit : false,
        write: false,
        read : true
    },
    mobile: {
        edit : false,
        write: false,
        read : true
    }
}, {
    module: ACL_MODULES.CUSTOM_REPORT,
    cms   : {
        edit : false,
        write: false,
        read : false
    },
    mobile: {
        edit : false,
        write: false,
        read : false
    }
}, {
    module: ACL_MODULES.NOTE,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: ACL_MODULES.NOTIFICATION,
    cms   : {
        edit : true,
        write: true,
        read : true
    },
    mobile: {
        edit : false,
        write: false,
        read : true
    }
}, {
    module: ACL_MODULES.SETTINGS,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
}, {
    module: ACL_MODULES.LOGIN_CREDENTIALS,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
}, {
    module: ACL_MODULES.AL_ALALI_QUESTIONNAIRE,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 30,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
},
{
    module: ACL_MODULES.COMPETITOR_PROMOTION_ACTIVITY,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
}, {
    module: ACL_MODULES.AL_ALALI_PROMO_EVALUATION,
    cms   : {
        archive: false,
        edit   : true,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : false,
        read   : true
    }
},
{
    module: ACL_MODULES.COMPETITOR_BRANDING_DISPLAY_REPORT,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
},
{
    module: ACL_MODULES.AL_ALALI_PROMOTIONS_ITEMS,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
},
{
    module: ACL_MODULES.NEW_PRODUCT_LAUNCH,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
},
{
    module: ACL_MODULES.ACHIEVEMENT_FORM,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
},
{
    module: ACL_MODULES.AL_ALALI_BRANDING_ACTIVITY,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
},
{
    module: ACL_MODULES.SHELF_SHARES,
    cms   : {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
},
{
    module: ACL_MODULES.PRICE_SURVEY,
    cms   : {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
},
{
    module: ACL_MODULES.AL_ALALI_BRANDING_ACTIVITY_ITEMS,
    cms   : {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : false,
        write : false,
        read  : true
    }
},
{
    module: ACL_MODULES.DOCUMENT,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
},
commentsAccess,
{
    module: 31,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : false,
        read   : true
    }
},
    {
        module: 43,
        cms   : {
            archive: false,
            edit   : false,
            write  : false,
            read   : false
        },
        mobile: {
            archive: false,
            edit   : false,
            write  : true,
            read   : false
        }
    }, {
        module: 44,
        cms   : {
            archive: false,
            edit   : false,
            write  : false,
            read   : false
        },
        mobile: {
            archive: false,
            edit   : true,
            write  : false,
            read   : true
        }
    },
    {
        module: ACL_MODULES.AL_ALALI_BRANDING_DISPLAY_REPORT,
        cms   : {
            archive: false,
            edit   : false,
            write  : false,
            read   : false
        },
        mobile: {
            archive: false,
            edit   : false,
            write  : true,
            read   : false
        }
    }
];

const salesman = [
{
    module: 1,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 2,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
}, {
    module: 3,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 4,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 5,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 6,
    cms   : {
        archive : false,
        edit    : true,
        write   : false,
        read    : true,
        evaluate: true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : false,
        read   : true
    }
}, {
    module: 7,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : false,
        read   : true
    }
}, {
    module: 10,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 11,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 12,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 13,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 14,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 15,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 16,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : false
    }
}, {
    module: 17,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : false
    }
}, {
    module: 18,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : false,
        read   : true
    }
}, {
    module: 19,
    cms   : {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : true,
        write : true,
        read  : true
    }
}, {
    module: 20,
    cms   : {
        upload: false,
        edit  : false,
        write : false,
        read  : false
    },
    mobile: {
        upload: false,
        edit  : false,
        write : false,
        read  : true
    }
}, {
    module: 21,
    cms   : {
        upload: false,
        edit  : false,
        write : false,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : false,
        write : false,
        read  : true
    }
}, {
    module: ACL_MODULES.CONTRACT_SECONDARY,
    cms   : {
        upload: false,
        edit  : false,
        write : false,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : false,
        write : false,
        read  : true
    }
}, {
    module: ACL_MODULES.EMPLOYEES_PERFORMANCE,
    cms   : {
        edit : false,
        write: false,
        read : false
    },
    mobile: {
        edit : false,
        write: false,
        read : false
    }
}, {
    module: ACL_MODULES.CUSTOM_REPORT,
    cms   : {
        edit : false,
        write: false,
        read : false
    },
    mobile: {
        edit : false,
        write: false,
        read : false
    }
}, {
    module: ACL_MODULES.NOTE,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: ACL_MODULES.NOTIFICATION,
    cms   : {
        edit : false,
        write: false,
        read : true
    },
    mobile: {
        edit : false,
        write: false,
        read : true
    }
}, {
    module: ACL_MODULES.SETTINGS,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
}, {
    module: ACL_MODULES.LOGIN_CREDENTIALS,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
}, {
    module: ACL_MODULES.AL_ALALI_QUESTIONNAIRE,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 30,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
},
{
    module: ACL_MODULES.COMPETITOR_PROMOTION_ACTIVITY,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
}, {
    module: ACL_MODULES.AL_ALALI_PROMO_EVALUATION,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : false
    }
},
{
    module: ACL_MODULES.COMPETITOR_BRANDING_DISPLAY_REPORT,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
},
{
    module: ACL_MODULES.AL_ALALI_PROMOTIONS_ITEMS,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
},
{
    module: ACL_MODULES.NEW_PRODUCT_LAUNCH,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
},
{
    module: ACL_MODULES.ACHIEVEMENT_FORM,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
},
{
    module: ACL_MODULES.AL_ALALI_BRANDING_ACTIVITY,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
},
{
    module: ACL_MODULES.SHELF_SHARES,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : false
    }
},
{
    module: ACL_MODULES.AL_ALALI_BRANDING_ACTIVITY_ITEMS,
    cms   : {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    },
    mobile: {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    }
},
{
    module: ACL_MODULES.PRICE_SURVEY,
    cms   : {
        archive: false,
        edit   : false,
        write  : true,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : false
    }
},
{
    module: ACL_MODULES.DOCUMENT,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
},
commentsAccess,
{
    module: 31,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : false,
        read   : true
    }
},
    {
        module: 43,
        cms   : {
            archive: false,
            edit   : false,
            write  : false,
            read   : false
        },
        mobile: {
            archive: false,
            edit   : false,
            write  : true,
            read   : false
        }
    }, {
        module: 44,
        cms   : {
            archive: false,
            edit   : false,
            write  : false,
            read   : false
        },
        mobile: {
            archive: false,
            edit   : true,
            write  : false,
            read   : true
        }
    },
    {
        module: ACL_MODULES.AL_ALALI_BRANDING_DISPLAY_REPORT,
        cms   : {
            archive: false,
            edit   : false,
            write  : false,
            read   : false
        },
        mobile: {
            archive: false,
            edit   : false,
            write  : true,
            read   : false
        }
    }
];

const merchandiser = [
{
    module: 1,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 2,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
}, {
    module: 3,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 4,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 5,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 6,
    cms   : {
        archive : false,
        edit    : true,
        write   : false,
        read    : true,
        evaluate: true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : false,
        read   : true
    }
}, {
    module: 7,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : false,
        read   : true
    }
}, {
    module: 10,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 11,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 12,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 13,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 14,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 15,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 16,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : false
    }
}, {
    module: 17,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : false
    }
}, {
    module: 18,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : false,
        read   : true
    }
}, {
    module: 19,
    cms   : {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : true,
        write : true,
        read  : true
    }
}, {
    module: 20,
    cms   : {
        upload: false,
        edit  : false,
        write : false,
        read  : false
    },
    mobile: {
        upload: false,
        edit  : false,
        write : false,
        read  : true
    }
}, {
    module: 21,
    cms   : {
        upload: false,
        edit  : false,
        write : false,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : false,
        write : false,
        read  : true
    }
}, {
    module: ACL_MODULES.CONTRACT_SECONDARY,
    cms   : {
        upload: false,
        edit  : false,
        write : false,
        read  : false
    },
    mobile: {
        upload: false,
        edit  : false,
        write : false,
        read  : false
    }
}, {
    module: ACL_MODULES.EMPLOYEES_PERFORMANCE,
    cms   : {
        edit : false,
        write: false,
        read : false
    },
    mobile: {
        edit : false,
        write: false,
        read : false
    }
}, {
    module: ACL_MODULES.CUSTOM_REPORT,
    cms   : {
        edit : false,
        write: false,
        read : false
    },
    mobile: {
        edit : false,
        write: false,
        read : false
    }
}, {
    module: ACL_MODULES.NOTE,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: ACL_MODULES.NOTIFICATION,
    cms   : {
        edit : false,
        write: false,
        read : true
    },
    mobile: {
        edit : false,
        write: false,
        read : true
    }
}, {
    module: ACL_MODULES.SETTINGS,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
}, {
    module: ACL_MODULES.LOGIN_CREDENTIALS,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
}, {
    module: ACL_MODULES.AL_ALALI_QUESTIONNAIRE,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 30,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
},
{
    module: ACL_MODULES.COMPETITOR_PROMOTION_ACTIVITY,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
}, {
    module: ACL_MODULES.AL_ALALI_PROMO_EVALUATION,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : false
    }
},
{
    module: ACL_MODULES.COMPETITOR_BRANDING_DISPLAY_REPORT,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
},
{
    module: ACL_MODULES.AL_ALALI_PROMOTIONS_ITEMS,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
},
{
    module: ACL_MODULES.NEW_PRODUCT_LAUNCH,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
},
{
    module: ACL_MODULES.ACHIEVEMENT_FORM,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
},
{
    module: ACL_MODULES.AL_ALALI_BRANDING_ACTIVITY,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
},
{
    module: ACL_MODULES.SHELF_SHARES,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : false
    }
},
{
    module: ACL_MODULES.AL_ALALI_BRANDING_ACTIVITY_ITEMS,
    cms   : {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    },
    mobile: {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    }
},
{
    module: ACL_MODULES.PRICE_SURVEY,
    cms   : {
        archive: false,
        edit   : false,
        write  : true,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : false
    }
},
{
    module: ACL_MODULES.DOCUMENT,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, commentsAccess,
{
    module: 31,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : false,
        read   : true
    }
},
    {
        module: 43,
        cms   : {
            archive: false,
            edit   : false,
            write  : false,
            read   : false
        },
        mobile: {
            archive: false,
            edit   : false,
            write  : true,
            read   : false
        }
    }, {
        module: 44,
        cms   : {
            archive: false,
            edit   : false,
            write  : false,
            read   : false
        },
        mobile: {
            archive: false,
            edit   : true,
            write  : false,
            read   : true
        }
    },
    {
        module: ACL_MODULES.AL_ALALI_BRANDING_DISPLAY_REPORT,
        cms   : {
            archive: false,
            edit   : false,
            write  : false,
            read   : false
        },
        mobile: {
            archive: false,
            edit   : false,
            write  : true,
            read   : false
        }
    }
];

const cashVan = [
{
    module: 1,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 2,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
}, {
    module: 3,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 4,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 5,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 6,
    cms   : {
        archive : false,
        edit    : true,
        write   : false,
        read    : true,
        evaluate: true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : false,
        read   : true
    }
}, {
    module: 7,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : false,
        read   : true
    }
}, {
    module: 10,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 11,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 12,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 13,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 14,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 15,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 16,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : false
    }
}, {
    module: 17,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : false
    }
}, {
    module: 18,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : false,
        read   : true
    }
}, {
    module: 19,
    cms   : {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : true,
        write : true,
        read  : true
    }
}, {
    module: 20,
    cms   : {
        upload: false,
        edit  : false,
        write : false,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : false,
        write : false,
        read  : true
    }
}, {
    module: 21,
    cms   : {
        upload: false,
        edit  : false,
        write : false,
        read  : false
    },
    mobile: {
        upload: false,
        edit  : false,
        write : false,
        read  : false
    }
}, {
    module: ACL_MODULES.CONTRACT_SECONDARY,
    cms   : {
        upload: false,
        edit  : false,
        write : false,
        read  : false
    },
    mobile: {
        upload: false,
        edit  : false,
        write : false,
        read  : false
    }
}, {
    module: ACL_MODULES.EMPLOYEES_PERFORMANCE,
    cms   : {
        edit : false,
        write: false,
        read : false
    },
    mobile: {
        edit : false,
        write: false,
        read : false
    }
}, {
    module: ACL_MODULES.CUSTOM_REPORT,
    cms   : {
        edit : false,
        write: false,
        read : false
    },
    mobile: {
        edit : false,
        write: false,
        read : false
    }
}, {
    module: ACL_MODULES.NOTE,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: ACL_MODULES.NOTIFICATION,
    cms   : {
        edit : false,
        write: false,
        read : true
    },
    mobile: {
        edit : false,
        write: false,
        read : true
    }
}, {
    module: ACL_MODULES.SETTINGS,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
}, {
    module: ACL_MODULES.LOGIN_CREDENTIALS,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
}, {
    module: ACL_MODULES.AL_ALALI_QUESTIONNAIRE,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 30,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
},
{
    module: ACL_MODULES.COMPETITOR_PROMOTION_ACTIVITY,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
}, {
    module: ACL_MODULES.AL_ALALI_PROMO_EVALUATION,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : false
    }
},
{
    module: ACL_MODULES.COMPETITOR_BRANDING_DISPLAY_REPORT,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
},
{
    module: ACL_MODULES.AL_ALALI_PROMOTIONS_ITEMS,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
},
{
    module: ACL_MODULES.NEW_PRODUCT_LAUNCH,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
},
{
    module: ACL_MODULES.ACHIEVEMENT_FORM,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
},
{
    module: ACL_MODULES.AL_ALALI_BRANDING_ACTIVITY,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
},
{
    module: ACL_MODULES.SHELF_SHARES,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : false
    }
},
{
    module: ACL_MODULES.AL_ALALI_BRANDING_ACTIVITY_ITEMS,
    cms   : {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    },
    mobile: {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    }
},
{
    module: ACL_MODULES.PRICE_SURVEY,
    cms   : {
        archive: false,
        edit   : false,
        write  : true,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : false
    }
},
{
    module: ACL_MODULES.DOCUMENT,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, commentsAccess,
{
    module: 31,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : false,
        read   : true
    }
},
    {
        module: 43,
        cms   : {
            archive: false,
            edit   : false,
            write  : false,
            read   : false
        },
        mobile: {
            archive: false,
            edit   : false,
            write  : true,
            read   : false
        }
    }, {
        module: 44,
        cms   : {
            archive: false,
            edit   : false,
            write  : false,
            read   : false
        },
        mobile: {
            archive: false,
            edit   : true,
            write  : false,
            read   : true
        }
    },
    {
        module: ACL_MODULES.AL_ALALI_BRANDING_DISPLAY_REPORT,
        cms   : {
            archive: false,
            edit   : false,
            write  : false,
            read   : false
        },
        mobile: {
            archive: false,
            edit   : false,
            write  : true,
            read   : false
        }
    }
];

const masterUpload = [
{
    module: 1,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
}, {
    module: 2,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 3,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 4,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 5,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 6,
    cms   : {
        archive : true,
        edit    : true,
        write   : true,
        read    : true,
        evaluate: false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 7,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
}, {
    module: 10,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 11,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 12,
    cms   : {
        archive: true,
        edit   : true,
        write  : false,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : false,
        read   : true
    }
}, {
    module: 13,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 14,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 15,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 16,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 17,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 18,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
}, {
    module: 19,
    cms   : {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : true,
        write : true,
        read  : true
    }
}, {
    module: 20,
    cms   : {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : true,
        write : true,
        read  : true
    }
}, {
    module: 21,
    cms   : {
        upload: true,
        edit  : false,
        write : false,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : false,
        write : false,
        read  : true
    }
}, {
    module: ACL_MODULES.CONTRACT_SECONDARY,
    cms   : {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : true,
        write : true,
        read  : true
    }
}, {
    module: ACL_MODULES.EMPLOYEES_PERFORMANCE,
    cms   : {
        edit : false,
        write: false,
        read : false
    },
    mobile: {
        edit : false,
        write: false,
        read : false
    }
}, {
    module: ACL_MODULES.CUSTOM_REPORT,
    cms   : {
        edit : false,
        write: true,
        read : true
    },
    mobile: {
        edit : false,
        write: false,
        read : false
    }
}, {
    module: ACL_MODULES.NOTE,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: ACL_MODULES.NOTIFICATION,
    cms   : {
        edit : true,
        write: true,
        read : true
    },
    mobile: {
        edit : false,
        write: false,
        read : true
    }
}, {
    module: ACL_MODULES.SETTINGS,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: ACL_MODULES.LOGIN_CREDENTIALS,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: ACL_MODULES.AL_ALALI_QUESTIONNAIRE,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 30,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
},
{
    module: ACL_MODULES.COMPETITOR_PROMOTION_ACTIVITY,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
},
{
    module: ACL_MODULES.AL_ALALI_PROMO_EVALUATION,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
},
{
    module: ACL_MODULES.COMPETITOR_BRANDING_DISPLAY_REPORT,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
},
{
    module: ACL_MODULES.AL_ALALI_PROMOTIONS_ITEMS,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
},
{
    module: ACL_MODULES.NEW_PRODUCT_LAUNCH,
    cms   : {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
},
{
    module: ACL_MODULES.ACHIEVEMENT_FORM,
    cms   : {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
},
{
    module: ACL_MODULES.AL_ALALI_BRANDING_ACTIVITY,
    cms   : {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
},
{
    module: ACL_MODULES.SHELF_SHARES,
    cms   : {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
},
{
    module: ACL_MODULES.PRICE_SURVEY,
    cms   : {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
},
{
    module: ACL_MODULES.AL_ALALI_BRANDING_ACTIVITY_ITEMS,
    cms   : {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    },
    mobile: {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    }
},
{
    module: ACL_MODULES.DOCUMENT,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
},
{
    module: 103,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
},
{
    module: 104,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
},
{
    module: 105,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
},
commentsAccess,
{
    module: 31,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
},
    {
        module: 43,
        cms   : {
            archive: false,
            edit   : true,
            write  : false,
            read   : true
        },
        mobile: {
            archive: false,
            edit   : false,
            write  : true,
            read   : false
        }
    }, {
        module: 44,
        cms   : {
            archive: false,
            edit   : true,
            write  : true,
            read   : false
        },
        mobile: {
            archive: false,
            edit   : false,
            write  : false,
            read   : true
        }
    },
    {
        module: ACL_MODULES.AL_ALALI_BRANDING_DISPLAY_REPORT,
        cms   : {
            archive: false,
            edit   : true,
            write  : true,
            read   : true
        },
        mobile: {
            archive: false,
            edit   : false,
            write  : true,
            read   : false
        }
    }
];

const countryUpload = [
{
    module: 1,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
}, {
    module: 2,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 3,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 103,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 104,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 105,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 4,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 5,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 6,
    cms   : {
        archive : true,
        edit    : true,
        write   : true,
        read    : true,
        evaluate: false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 7,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
}, {
    module: 10,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 11,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 12,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : false,
        read   : true
    }
}, {
    module: 13,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 14,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 15,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 16,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 17,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 18,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
}, {
    module: 19,
    cms   : {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : true,
        write : true,
        read  : true
    }
}, {
    module: 20,
    cms   : {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : true,
        write : true,
        read  : true
    }
}, {
    module: 21,
    cms   : {
        upload: true,
        edit  : false,
        write : false,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : false,
        write : false,
        read  : true
    }
}, {
    module: ACL_MODULES.CONTRACT_SECONDARY,
    cms   : {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : true,
        write : true,
        read  : true
    }
}, {
    module: ACL_MODULES.EMPLOYEES_PERFORMANCE,
    cms   : {
        edit : false,
        write: false,
        read : false
    },
    mobile: {
        edit : false,
        write: false,
        read : false
    }
}, {
    module: ACL_MODULES.CUSTOM_REPORT,
    cms   : {
        edit : false,
        write: true,
        read : true
    },
    mobile: {
        edit : false,
        write: false,
        read : false
    }
}, {
    module: ACL_MODULES.NOTE,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: ACL_MODULES.NOTIFICATION,
    cms   : {
        edit : true,
        write: true,
        read : true
    },
    mobile: {
        edit : false,
        write: false,
        read : true
    }
}, {
    module: ACL_MODULES.SETTINGS,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: ACL_MODULES.LOGIN_CREDENTIALS,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: ACL_MODULES.AL_ALALI_QUESTIONNAIRE,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 30,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
},
{
    module: ACL_MODULES.COMPETITOR_PROMOTION_ACTIVITY,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
},
{
    module: ACL_MODULES.AL_ALALI_PROMO_EVALUATION,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
},
{
    module: ACL_MODULES.COMPETITOR_BRANDING_DISPLAY_REPORT,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
},
{
    module: ACL_MODULES.AL_ALALI_PROMOTIONS_ITEMS,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
},
{
    module: ACL_MODULES.NEW_PRODUCT_LAUNCH,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
},
{
    module: ACL_MODULES.ACHIEVEMENT_FORM,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
},
{
    module: ACL_MODULES.AL_ALALI_BRANDING_ACTIVITY,
    cms   : {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
},
{
    module: ACL_MODULES.SHELF_SHARES,
    cms   : {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
},
{
    module: ACL_MODULES.PRICE_SURVEY,
    cms   : {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
},
{
    module: ACL_MODULES.AL_ALALI_BRANDING_ACTIVITY_ITEMS,
    cms   : {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    },
    mobile: {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    }
},
{
    module: ACL_MODULES.DOCUMENT,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
},
commentsAccess,
{
    module: 31,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
},
    {
        module: ACL_MODULES.AL_ALALI_BRANDING_DISPLAY_REPORT,
        cms   : {
            archive: false,
            edit   : true,
            write  : true,
            read   : true
        },
        mobile: {
            archive: false,
            edit   : false,
            write  : true,
            read   : false
        }
    }
];

const tradeMarketer = [
    {
        module: 1,
        cms   : {
            archive: false,
            edit   : false,
            write  : false,
            read   : true
        },
        mobile: {
            archive: false,
            edit   : false,
            write  : false,
            read   : true
        }
    },
    {
        module: 2,
        cms   : {
            archive: false,
            edit   : false,
            write  : false,
            read   : true
        },
        mobile: {
            archive: false,
            edit   : false,
            write  : false,
            read   : true
        }
    },
    {
        module: 3,
        cms   : {
            archive: false,
            edit   : false,
            write  : false,
            read   : true
        },
        mobile: {
            archive: false,
            edit   : false,
            write  : false,
            read   : true
        }
    },
    {
        module: 103,
        cms   : {
            archive: false,
            edit   : false,
            write  : false,
            read   : true
        },
        mobile: {
            archive: false,
            edit   : false,
            write  : false,
            read   : true
        }
    },
    {
        module: 104,
        cms   : {
            archive: false,
            edit   : false,
            write  : false,
            read   : true
        },
        mobile: {
            archive: false,
            edit   : false,
            write  : false,
            read   : true
        }
    },
    {
        module: 105,
        cms   : {
            archive: false,
            edit   : false,
            write  : false,
            read   : true
        },
        mobile: {
            archive: false,
            edit   : false,
            write  : false,
            read   : true
        }
    },
    {
        module: 4,
        cms   : {
            archive: true,
            edit   : true,
            write  : true,
            read   : true
        },
        mobile: {
            archive: false,
            edit   : false,
            write  : false,
            read   : true
        }
    },
    {
        module: 5,
        cms   : {
            archive: false,
            edit   : false,
            write  : false,
            read   : true
        },
        mobile: {
            archive: false,
            edit   : false,
            write  : false,
            read   : true
        }
    },
    {
        module: 6,
        cms   : {
            archive : false,
            edit    : false,
            write   : false,
            read    : true,
            evaluate: false
        },
        mobile: {
            archive: false,
            edit   : false,
            write  : false,
            read   : true
        }
    },
    {
        module: 7,
        cms   : {
            archive: false,
            edit   : false,
            write  : false,
            read   : false
        },
        mobile: {
            archive: false,
            edit   : false,
            write  : false,
            read   : false
        }
    },
    {
        module: 10,
        cms   : {
            archive: false,
            edit   : false,
            write  : false,
            read   : true
        },
        mobile: {
            archive: false,
            edit   : false,
            write  : false,
            read   : true
        }
    },
    {
        module: 11,
        cms   : {
            archive: false,
            edit   : false,
            write  : false,
            read   : true
        },
        mobile: {
            archive: false,
            edit   : false,
            write  : false,
            read   : true
        }
    },
    {
        module: 12,
        cms   : {
            archive: false,
            edit   : false,
            write  : false,
            read   : true
        },
        mobile: {
            archive: false,
            edit   : false,
            write  : false,
            read   : true
        }
    },
    {
        module: 13,
        cms   : {
            archive: true,
            edit   : true,
            write  : true,
            read   : true
        },
        mobile: {
            archive: false,
            edit   : false,
            write  : false,
            read   : true
        }
    },
    {
        module: 14,
        cms   : {
            archive: false,
            edit   : false,
            write  : false,
            read   : false
        },
        mobile: {
            archive: false,
            edit   : false,
            write  : false,
            read   : false
        }
    },
    {
        module: 15,
        cms   : {
            archive: false,
            edit   : true,
            write  : true,
            read   : true
        },
        mobile: {
            archive: false,
            edit   : true,
            write  : true,
            read   : true
        }
    },
    {
        module: ACL_MODULES.AL_ALALI_MARKETING,
        cms   : {
            archive: false,
            edit   : false,
            write  : false,
            read   : true
        },
        mobile: {
            archive: false,
            edit   : true,
            write  : true,
            read   : true
        }
    },
    {
        module: ACL_MODULES.OBJECTIVES_AND_TASKS_FORM,
        cms   : {
            archive: false,
            edit   : false,
            write  : false,
            read   : false
        },
        mobile: {
            archive: false,
            edit   : false,
            write  : false,
            read   : false
        }
    },
    {
        module: ACL_MODULES.IN_STORE_REPORTING,
        cms   : {
            archive: true,
            edit   : true,
            write  : true,
            read   : true
        },
        mobile: {
            archive: true,
            edit   : true,
            write  : true,
            read   : true
        }
    },
    {
        module: ACL_MODULES.CONTRACT,
        cms   : {
            upload: false,
            edit  : false,
            write : false,
            read  : false
        },
        mobile: {
            upload: false,
            edit  : false,
            write : false,
            read  : true
        }
    },
    {
        module: ACL_MODULES.CONTRACT_YEARLY_AND_VISIBILITY,
        cms   : {
            upload: false,
            edit  : false,
            write : false,
            read  : false
        },
        mobile: {
            upload: false,
            edit  : false,
            write : false,
            read  : true
        }
    },
    {
        module: ACL_MODULES.VISIBILITY,
        cms   : {
            upload: true,
            edit  : true,
            write : true,
            read  : true
        },
        mobile: {
            upload: true,
            edit  : true,
            write : true,
            read  : true
        }
    },
    {
        module: ACL_MODULES.CONTRACT_SECONDARY,
        cms   : {
            upload: false,
            edit  : false,
            write : false,
            read  : true
        },
        mobile: {
            upload: false,
            edit  : false,
            write : false,
            read  : true
        }
    },
    {
        module: ACL_MODULES.EMPLOYEES_PERFORMANCE,
        cms   : {
            edit : false,
            write: false,
            read : false
        },
        mobile: {
            edit : false,
            write: false,
            read : false
        }
    },
    {
        module: ACL_MODULES.CUSTOM_REPORT,
        cms   : {
            edit : false,
            write: false,
            read : false
        },
        mobile: {
            edit : false,
            write: false,
            read : false
        }
    },
    {
        module: ACL_MODULES.NOTE,
        cms   : {
            archive: true,
            edit   : true,
            write  : true,
            read   : true
        },
        mobile: {
            archive: true,
            edit   : true,
            write  : true,
            read   : true
        }
    },
    {
        module: ACL_MODULES.NOTIFICATION,
        cms   : {
            edit : true,
            write: true,
            read : true
        },
        mobile: {
            edit : false,
            write: false,
            read : true
        }
    },
    {
        module: ACL_MODULES.SETTINGS,
        cms   : {
            archive: true,
            edit   : true,
            write  : true,
            read   : true
        },
        mobile: {
            archive: true,
            edit   : true,
            write  : true,
            read   : true
        }
    },
    {
        module: ACL_MODULES.LOGIN_CREDENTIALS,
        cms   : {
            archive: false,
            edit   : false,
            write  : false,
            read   : false
        },
        mobile: {
            archive: false,
            edit   : false,
            write  : false,
            read   : false
        }
    },
    {
        module: ACL_MODULES.AL_ALALI_QUESTIONNAIRE,
        cms   : {
            archive: true,
            edit   : true,
            write  : true,
            read   : true
        },
        mobile: {
            archive: true,
            edit   : true,
            write  : true,
            read   : true
        }
    },
    {
        module: 30,
        cms   : {
            archive: true,
            edit   : true,
            write  : true,
            read   : true
        },
        mobile: {
            archive: true,
            edit   : true,
            write  : true,
            read   : true
        }
    },
    {
        module: ACL_MODULES.COMPETITOR_PROMOTION_ACTIVITY,
        cms   : {
            archive: false,
            edit   : false,
            write  : false,
            read   : false
        },
        mobile: {
            archive: false,
            edit   : false,
            write  : false,
            read   : false
        }
    },
    {
        module: ACL_MODULES.AL_ALALI_PROMO_EVALUATION,
        cms   : {
            archive: false,
            edit   : true,
            write  : true,
            read   : true
        },
        mobile: {
            archive: false,
            edit   : false,
            write  : false,
            read   : false
        }
    },
    {
        module: ACL_MODULES.COMPETITOR_BRANDING_DISPLAY_REPORT,
        cms   : {
            archive: false,
            edit   : true,
            write  : true,
            read   : true
        },
        mobile: {
            archive: false,
            edit   : false,
            write  : false,
            read   : false
        }
    },
    {
        module: ACL_MODULES.AL_ALALI_PROMOTIONS_ITEMS,
        cms   : {
            archive: false,
            edit   : false,
            write  : false,
            read   : true
        },
        mobile: {
            archive: false,
            edit   : false,
            write  : false,
            read   : false
        }
    },
    {
        module: ACL_MODULES.NEW_PRODUCT_LAUNCH,
        cms   : {
            archive: false,
            edit   : false,
            write  : false,
            read   : true
        },
        mobile: {
            archive: false,
            edit   : false,
            write  : false,
            read   : true
        }
    },
    {
        module: ACL_MODULES.ACHIEVEMENT_FORM,
        cms   : {
            archive: false,
            edit   : false,
            write  : false,
            read   : true
        },
        mobile: {
            archive: false,
            edit   : false,
            write  : false,
            read   : true
        }
    },
    {
        module: ACL_MODULES.AL_ALALI_BRANDING_ACTIVITY,
        cms   : {
            archive: false,
            edit   : false,
            write  : false,
            read   : true
        },
        mobile: {
            archive: false,
            edit   : false,
            write  : true,
            read   : true
        }
    },
    {
        module: ACL_MODULES.SHELF_SHARES,
        cms   : {
            archive: false,
            edit   : true,
            write  : true,
            read   : true
        },
        mobile: {
            archive: false,
            edit   : true,
            write  : true,
            read   : true
        }
    },
    {
        module: ACL_MODULES.PRICE_SURVEY,
        cms   : {
            archive: false,
            edit   : true,
            write  : true,
            read   : true
        },
        mobile: {
            archive: false,
            edit   : true,
            write  : true,
            read   : true
        }
    },
    {
        module: ACL_MODULES.AL_ALALI_BRANDING_ACTIVITY_ITEMS,
        cms   : {
            upload: true,
            edit  : true,
            write : true,
            read  : true
        },
        mobile: {
            upload: true,
            edit  : true,
            write : true,
            read  : true
        }
    },
    {
        module: ACL_MODULES.DOCUMENT,
        cms   : {
            archive: true,
            edit   : true,
            write  : true,
            read   : true
        },
        mobile: {
            archive: true,
            edit   : true,
            write  : true,
            read   : true
        }
    },
    commentsAccess,
    {
        module: ACL_MODULES.AL_ALALI_QUESTIONNAIRE,
        cms   : {
            archive: false,
            edit   : false,
            write  : false,
            read   : true
        },
        mobile: {
            archive: false,
            edit   : true,
            write  : true,
            read   : true
        }
    },
    {
        module: ACL_MODULES.AL_ALALI_BRANDING_DISPLAY_REPORT,
        cms   : {
            archive: false,
            edit   : false,
            write  : false,
            read   : true
        },
        mobile: {
            archive: false,
            edit   : false,
            write  : true,
            read   : false
        }
    }
];

const accessRolesData = {
    0: superAdmin,
    1: masterAdmin,
    2: countryAdmin,
    3: areaFiledManager,
    4: areaInChargeManager,
    5: salesman,
    6: merchandiser,
    7: cashVan,
    8: masterUpload,
    9: countryUpload,
    10: tradeMarketer
};

const accessRoles = [];

for (let level in accessRolesData) {
    const roleAccess = accessRolesData[level];

    accessRoles.push({
        roleAccess
    });
}

const levels = [
    'Super User',
    'Master Admin',
    'Country Admin',
    'Area Manager',
    'Area in charge',
    'Sales Man',
    'Merchandiser',
    'Cash van',
    'Master uploader',
    'Country uploader',
    'Trade marketer'
];

const generate = (callback) => {
    async.waterfall([

        (cb) => {
            AccessRoleModel.update({}, {
                $set: {
                    roleAccess: []
                }
            }, {
                multi: true
            }, cb);
        },

        (result, cb) => {
            async.eachOf(accessRolesData, (roleAccess, level, eachCb) => {
                const name = levels[level];

                AccessRoleModel.findOneAndUpdate({
                    'name.en': name
                }, {
                    $set: {
                        'name.en': name,
                        level,
                        roleAccess
                    }
                }, {
                    new: true,
                    upsert: true
                }, (err, model) => {
                    if (model) {
                        accessRoles[level].id = model._id.toString();
                    }

                    eachCb(err, model);
                });
            }, cb);
        }

    ], (err) => {
        if (err) {
            logger.error('Fail to setup access roles!', err);
            return callback(err);
        }

        logger.info('Setup is done for access roles.');
        callback();
    });
};

module.exports = {
    generate,
    accessRoles
};
