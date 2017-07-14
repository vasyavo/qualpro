var CONSTANTS = require('./contentType');

module.exports = {
    3: {
        _id : 3,
        name: {
            en: 'Country',
            ar: 'الدولة'
        },
        href: CONSTANTS.DOMAIN + '/' + CONSTANTS.COUNTRY
    },

    4: {
        _id : 4,
        name: {
            en: 'Customer',
            ar: 'العميل'
        },
        href: CONSTANTS.OUTLET
    },

    5: {
        _id : 5,
        name: {
            en: 'Trade channel',
            ar: 'قطاع التجزئة'
        },
        href: CONSTANTS.RETAILSEGMENT
    },

    6: {
        _id : 6,
        name: {
            en: 'Personnel',
            ar: 'شؤون الموظفين'
        },
        href: CONSTANTS.PERSONNEL
    },

    7: {
        _id : 7,
        name: {
            en: 'Objective',
            ar: 'الأهداف'
        },
        href: CONSTANTS.OBJECTIVES
    },

    10: {
        _id : 10,
        name: {
            en: 'Items and Prices',
            ar: ' السلع والأسعار'
        },
        href: CONSTANTS.ITEMSPRICES
    },

    11: {
        _id : 11,
        name: {
            en: 'Planogram',
            ar: 'طريقة العرض'
        },
        href: CONSTANTS.PLANOGRAM
    },

    12: {
        _id : 12,
        name: {
            en: 'Competitor List',
            ar: 'قائمة الشركات المنافسة'
        },
        href: CONSTANTS.COMPETITORSLIST
    },

    15: {
        _id : 15,
        name: {
            en: 'Reporting',
            ar: 'التقارير'
        },
        href: 'reporting'
    },

    18: {
        _id : 18,
        name: {
            en: 'In-store Reporting',
            ar: 'البالغات في المتاجر'
        },
        href: CONSTANTS.INSTORETASKS
    },

    20: {
        _id : 20,
        name: {
            en: 'Contract Yearly and Visibility',
            ar: 'العقود السنوية والمرئية'
        },
        href: CONSTANTS.CONTRACTSYEARLY
    },

    22: {
        _id : 22,
        name: {
            en: 'Contract Secondary',
            ar: 'العقود الثانوية'
        },
        href: CONSTANTS.CONTRACTSSECONDARY
    },

    25: {
        _id : 25,
        name: {
            en: 'Note',
            ar: 'الملاحظات'
        },
        href: CONSTANTS.NOTES
    },

    26: {
        _id : 26,
        name: {
            en: 'Notification',
            ar: 'الإشعارات'
        },
        href: CONSTANTS.NOTIFICATIONS
    },

    31: {
        _id : 31,
        name: {
            en: 'al alali Questionnaire',
            ar: 'استطلاع العلالي'
        },
        href: CONSTANTS.QUESTIONNARIES
    },

    32: {
        _id : 32,
        name: {
            en: 'Competitor promotion activity',
            ar: 'أنشطة ترويج المنافسين'
        },
        href: CONSTANTS.COMPETITORPROMOTION
    },

    33: {
        _id : 33,
        name: {
            en: 'al alali promo evaluation',
            ar: 'تقييم ترويج العلالي '
        },
        href: CONSTANTS.PROMOTIONS
    },

    34: {
        _id : 34,
        name: {
            en: 'Competitor branding & display report',
            ar: 'العلامات التجارية وتقارير العرض للمنافسين'
        },
        href: CONSTANTS.COMPETITORBRANDING
    },

    35: {
        _id : 35,
        name: {
            en: 'al alali promotions items',
            ar: 'ترويج السلع'
        },
        href: CONSTANTS.PROMOTIONSITEMS
    },

    36: {
        _id : 36,
        name: {
            en: 'New product launch',
            ar: 'إطلاق منتج جديد'
        },
        href: CONSTANTS.NEWPRODUCTLAUNCH
    },

    37: {
        _id : 37,
        name: {
            en: 'Achievement form',
            ar: 'استمارة الإنجازات'
        },
        href: CONSTANTS.ACHIEVEMENTFORM
    },

    38: {
        _id : 38,
        name: {
            en: 'al alali Marketing Campaigns & Display report',
            ar: 'العلامات التجارية وتقارير العرض الخاصة بالعلالي'
        },
        href: CONSTANTS.MARKETING_CAMPAIGN
    },

    39: {
        _id : 39,
        name: {
            en: 'Shelf shares',
            ar: 'حصة الرف'
        },
        href: CONSTANTS.SHELFSHARES
    },

    40: {
        _id : 40,
        name: {
            en: 'al alali Marketing Campaigns & Display items',
            ar: 'العلامات التجارية وتقارير العرض للسلع'
        },
        href: CONSTANTS.MARKETING_CAMPAIGN_ITEM
    },

    45: {
        _id: 45,
        name: {
            en: 'al alali Branding & Monthly display',
            ar: 'العلامات التجارية وتقارير العرض الخاصة بالعلالي'
        },
        href: CONSTANTS.BRANDING_AND_MONTHLY_DISPLAY,
    },

    41: {
        _id : 41,
        name: {
            en: 'Price survey',
            ar: 'الدراسة الاستقصائية للأسعار'
        },
        href: CONSTANTS.PRICESURVEY
    },

    42: {
        _id : 42,
        name: {
            en: 'Document',
            ar: 'لوثائق'
        },
        href: CONSTANTS.DOCUMENTS
    },

    43: {
        _id : 43,
        name : {
            en: 'Contact Us',
            ar: 'اتصل بنا'
        },
        href: CONSTANTS.CONTACT_US
    },

    44: {
        _id : 44,
        name : {
            en: 'Consumer Survey',
            ar: 'استطلاع العملاء'
        },
        href: CONSTANTS.CONSUMER_SURVEY
    },

    103: {
        _id : 103,
        name: {
            en: 'Region',
            ar: 'المنطقة'
        },
        href: CONSTANTS.DOMAIN + '/' + CONSTANTS.REGION
    },

    104: {
        _id : 104,
        name: {
            en: 'Sub-region',
            ar: 'المنطقة الفرعية'
        },
        href: CONSTANTS.DOMAIN + '/' + CONSTANTS.SUBREGION
    },

    105: {
        _id : 105,
        name: {
            en: 'Branch',
            ar: 'الفرع'
        },
        href: CONSTANTS.BRANCH
    },

    1110: {
        _id : 105,
        name: {
            en: 'Visibility Form',
            ar: '' //todo set ar translation
        },
        href: CONSTANTS.VISIBILITYFORM
    }
};
