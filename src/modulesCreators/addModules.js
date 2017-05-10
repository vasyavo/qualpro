const ModuleModel = require('./../types/module/model');
const logger = require('./../utils/logger');
const async = require('async');
const CONSTANTS = require('../public/js/constants/contentType');

const modules = [
    {
        _id     : 1,
        name    : {en: 'Activity list', ar: 'قائمة الأنشطة'},
        href    : 'activityList',
        sequence: 1,
        parrent : null,
        visible : true
    },

    {
        _id     : 2,
        name    : {en: 'Locations', ar: 'المواقع'},
        href    : 'locations',
        sequence: 2,
        parrent : null,
        visible : true
    },

    {
        _id     : 3,
        name    : {en: 'Countries', ar: 'البلدان'},
        href    : CONSTANTS.DOMAIN + '/' + CONSTANTS.COUNTRY,
        sequence: 3,
        parrent : 2,
        visible : true
    },

    {
        _id     : 103,
        name: {
            en: 'Sub-region',
            ar: 'المنطقة الفرعية'
        }, //CA & CU regions
        href    : '',
        sequence: 103,
        parrent : null,
        visible : false
    },

    {
        _id     : 104,
        name    : {en: 'subRegions', ar: 'AR_ subRegions'}, //CA & CU subRegions // todo translation
        href    : '',
        sequence: 104,
        parrent : null,
        visible : false
    },

    {
        _id     : 4,
        name    : {en: 'Customers', ar: 'أسماء العملاء'},
        href    : CONSTANTS.OUTLET,
        sequence: 4,
        parrent : 2,
        visible : true
    },

    {
        _id     : 5,
        name    : {en: 'Trade channels', ar: 'الفئات التجارية'},
        href    : CONSTANTS.RETAILSEGMENT,
        sequence: 5,
        parrent : 2,
        visible : true
    },

    {
        _id     : 105,
        name: {
            en: 'Branch',
            ar: 'الفرع'
        },
        href    : CONSTANTS.BRANCH,
        sequence: 105,
        parrent : null,
        visible : false
    },

    {
        _id     : 6,
        name    : {en: 'Personnel', ar: 'شؤون الموظفين'},
        href    : CONSTANTS.PERSONNEL,
        sequence: 6,
        parrent : null,
        visible : true
    },

    {
        _id     : 7,
        name    : {en: 'Objectives', ar: 'الأهداف'},
        href    : CONSTANTS.OBJECTIVES,
        sequence: 7,
        parrent : null,
        visible : true
    },

    {
        _id     : 18,
        name    : {en: 'In-store Reporting', ar: 'المهام'},
        href    : CONSTANTS.INSTORETASKS,
        sequence: 8,
        parrent : null,
        visible : true
    },

    {
        _id     : 10,
        name    : {en: 'Items and Prices', ar: 'الاصناف والأسعار'},
        href    : CONSTANTS.ITEMSPRICES,
        sequence: 10,
        parrent : null,
        visible : true
    },

    {
        _id     : 11,
        name    : {en: 'Planograms', ar: 'طريقة العرض'},
        href    : CONSTANTS.PLANOGRAM,
        sequence: 11,
        parrent : null,
        visible : true
    },

    {
        _id     : 12,
        name    : {en: 'Competitor List', ar: 'قائمة الشركات المنافسة'},
        href    : CONSTANTS.COMPETITORSLIST,
        sequence: 12,
        parrent : null,
        visible : true
    },

    {
        _id     : 13,
        name: {
            en: 'Profile',
            ar: 'الملف الشخصي'
        },
        href    : 'profile',
        sequence: 13,
        parrent : 6,
        visible : false
    },

    {
        _id     : 14,
        name: {
            en: 'Performance',
            ar: 'الأداء'
        },
        href    : 'performance',
        sequence: 14,
        parrent : 6,
        visible : false
    },

    {
        _id     : 15,
        name    : {en: 'Reporting', ar: 'التقارير'},
        href    : 'reporting',
        sequence: 15,
        parrent : null,
        visible : true
    },

    {
        _id     : 16,
        name    : {en: 'al alali Marketing', ar: 'تسويق العلالي'},
        href    : 'alalalimarketing',
        sequence: 16,
        parrent : null,
        visible : true
    },

    {
        _id     : 17,
        name: {
            en: 'Objectives and tasks form',
            ar: ' نموزج الأهداف والمهام في المتاجر'
        },
        href    : 'objectivesAndTasksForms',
        sequence: 17,
        parrent : 7,
        visible : false
    },

    /*{
     _id     : 18,
     name   : {en: 'In-store tasks', ar: 'AR_ In-store tasks'},
     href    : 'inStoreTasks',
     sequence: 18,
     parrent : null,
     visible : false
     },*/

    {
        _id     : 19,
        name    : {en: 'Contracts', ar: 'العقود.'},
        href    : 'contracts',
        sequence: 19,
        parrent : null,
        visible : true
    },

    {
        _id     : 20,
        name    : {en: 'Yearly and Visibility', ar: 'العقود السنوية والمرئية'},
        href    : 'contractsYearly',
        sequence: 20,
        parrent : 19,
        visible : true
    },

    {
        _id     : 21,
        name: {
            en: 'Visibility',
            ar: ' الرؤية'
        },
        href    : 'contractsVisibility',
        sequence: 21,
        parrent : 19,
        visible : false
    },

    {
        _id     : 22,
        name    : {en: 'Secondary', ar: 'العقود الثانوية'},
        href    : 'contractsSecondary',
        sequence: 22,
        parrent : 19,
        visible : true
    },

    {
        _id     : 23,
        name: {
            en: 'Employees Performance',
            ar: 'أداء الموظف'
        },
        href    : 'employeesPerformance',
        sequence: 23,
        parrent : 6,
        visible : false
    },

    {
        _id          : 24,
        name         : {en: 'Custom Reports', ar: 'قائمة التقارير'},
        href         : 'custom-reports',
        hrefNotInHash: true,
        sequence     : 24,
        parrent      : null,
        visible      : true
    },

    {
        _id     : 25,
        name    : {en: 'Notes', ar: 'الملاحظات'},
        href    : 'notes',
        sequence: 25,
        parrent : null,
        visible : true
    },

    {
        _id     : 26,
        name    : {en: 'Notifications', ar: 'الإشعارات'},
        href    : 'notifications',
        sequence: 26,
        parrent : null,
        visible : true
    },

    {
        _id     : 27,
        name    : {en: 'Settings', ar: 'الإعدادات'},
        href    : 'settings',
        sequence: 27,
        parrent : null,
        visible : false
    },

    {
        _id     : 28,
        name: {
            en: 'Login Credentials',
            ar: 'بيانات تسجيل للدخول'
        },
        href    : 'loginCredentials',
        sequence: 28,
        parrent : 27,
        visible : false
    },

    {
        _id     : 29,
        name    : {en: 'Grant and revoke access', ar: 'AR_ Grant and revoke access'}, // todo translation
        href    : 'grantrevokeaccess',
        sequence: 29,
        parrent : 27,
        visible : false
    },

    {
        _id     : 30,
        name    : {en: 'Delegate and recall rights', ar: 'AR_ Delegate and recall rights'}, // todo translation
        href    : 'delegateAndRecallRights',
        sequence: 30,
        parrent : 27,
        visible : false
    },

    {
        _id     : 31,
        name    : {en: 'al alali Questionnaire', ar: 'استطلاع العلالي'},
        href    : 'questionnary',
        sequence: 31,
        parrent : 16,
        visible : true
    },

    {
        _id     : 32,
        name    : {en: 'Competitor promotion activities', ar: 'أنشطة ترويج المنافسين'},
        href    : 'competitorPromotion',
        sequence: 32,
        parrent : 15,
        visible : true
    },

    {
        _id     : 33,
        name    : {en: 'al alali promo evaluation', ar: 'تقييم ترويج العلالي '},
        href    : CONSTANTS.PROMOTIONS,
        sequence: 33,
        parrent : 15,
        visible : true
    },

    {
        _id     : 34,
        name    : {en: 'Competitor branding & display report', ar: 'العلامات التجارية وتقارير العرض للمنافسين'},
        href    : 'competitorBranding',
        sequence: 34,
        parrent : 15,
        visible : true
    },

    {
        _id     : 35,
        name: {
            en: 'al alali promotions items',
            ar: 'ترويج السلع'
        },
        href    : CONSTANTS.PROMOTIONSITEMS,
        sequence: 33,
        parrent : 15,
        visible : false
    },

    {
        _id     : 36,
        name    : {en: 'New product launch', ar: 'إطلاق منتج جديد'},
        href    : CONSTANTS.NEWPRODUCTLAUNCH,
        sequence: 36,
        parrent : 15,
        visible : true
    },

    {
        _id     : 37,
        name    : {en: 'Achievement form', ar: 'استمارة الإنجازات'},
        href    : CONSTANTS.ACHIEVEMENTFORM,
        sequence: 35,
        parrent : 15,
        visible : true
    },

    {
        _id     : 41,
        name    : {en: 'Price survey', ar: 'الدراسة الاستقصائية للأسعار'},
        href    : CONSTANTS.PRICESURVEY,
        sequence: 41,
        parrent : 15,
        visible : true
    },

    {
        _id     : 38,
        name    : {en: 'al alali Marketing Campaigns', ar: 'العلامات التجارية وتقارير العرض الخاصة بالعلالي'},
        href    : CONSTANTS.MARKETING_CAMPAIGN,
        sequence: 38,
        parrent : 16,
        visible : true
    },

    {
        _id     : 40,
        name: {
            en: 'al alali Branding Activity items',
            ar: '' /*'العلامات التجارية وتقارير العرض للسلع'*/ // todo translation
        },
        href    : CONSTANTS.MARKETING_CAMPAIGN_ITEM,
        sequence: 40,
        parrent : 16,
        visible : false
    },

    {
        _id     : 1000,
        name: {
            en: 'Custom Reports',
            ar: ' التقارير المخصصة'
        },
        href    : CONSTANTS.CUSTOMREPORTS,
        sequence: 1000,
        parrent : null,
        visible : false
    },

    {
        _id     : 1110,
        name: {
            en: 'Visibility Form',
            ar: '' // todo translation
        },
        href    : CONSTANTS.VISIBILITYFORM,
        sequence: 1110,
        parrent : null,
        visible : false
    },
    {
        _id     : 1001,
        name: {
            en: 'Price report',
            ar: ' تقرير الاسعار'
        },
        href    : 'priceReport',
        sequence: 1001,
        parrent : 1000,
        visible : false
    },

    {
        _id     : 1010,
        name    : {
            en: 'Comment',
            ar: 'التعليق'
        },
        href    : CONSTANTS.COMMENT,
        sequence: 1010,
        parrent : null,
        visible : false
    },

    {
        _id     : 39,
        name    : {en: 'Shelf shares', ar: 'حصة الرف'},
        href    : CONSTANTS.SHELFSHARES,
        sequence: 39,
        parrent : 15,
        visible : true
    },

    {
        _id     : 42,
        name    : {en: 'Documents', ar: 'لوثائق'},
        href    : CONSTANTS.DOCUMENTS,
        sequence: 42,
        parrent : null,
        visible : true
    },

    {
        _id     : 43,
        name    : {en: 'Contact Us', ar: 'اتصل بنا'},
        href    : CONSTANTS.CONTACT_US,
        sequence: 43,
        parrent : null,
        visible : true
    },

    require('./../stories/consumersSurvey/acl/module'),

    {
        _id     : 45,
        name    : {en: 'al alali Branding & Monthly display', ar: 'العلامات التجارية وتقارير العرض الخاصة بالعلالي'},
        href    : CONSTANTS.BRANDING_AND_MONTHLY_DISPLAY,
        sequence: 45,
        parrent : 16,
        visible : true
    },
];

const q = async.queue((module, cb) => {
    ModuleModel.findOneAndUpdate({
        _id: module._id
    }, module, { upsert: true }, cb);
}, 1000);

const generate = (callback) => {
    q.drain = () => {
        logger.info('Modules are added successfully');
        callback();
    };

    q.push(modules);
};

module.exports = {
    generate
};
