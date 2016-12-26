(function () {
    'use strict';
    function getConstants(CONSTANTS) {
        var MODULE_NAMES = {
            /*1: {
             _id : 1,
             name: {
             en: 'Activity List',
             ar: 'قائمة الأنشطة'
             },
             href: CONSTANTS.ACTIVITYLIST
             },

             2: {
             _id : 2,
             name: {
             en: 'Locations',
             ar: 'المواقع'
             },
             href: 'locations'
             },*/

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

            /*13: {
             _id : 13,
             name: {
             en: 'Profile',
             ar: 'الملف الشخصي'
             }
             ,
             href: 'profile'
             },

             14: {
             _id : 14,
             name: {
             en: 'Performance',
             ar: 'الأداء'
             }
             ,
             href: 'performance'
             },*/

            15: {
                _id : 15,
                name: {
                    en: 'Reporting',
                    ar: 'التقارير'
                },
                href: 'reporting'
            },
            /*16: {
             _id : 16,
             name: {
             en: 'Al Alali Marketing',
             ar: 'تسويق العلالي'
             },
             href: 'alalalimarketing'
             },
             17: {
             _id : 17,
             name: {
             en: 'Objectives and tasks form',
             ar: ' نموزج الأهداف والمهام في المتاجر'
             }
             ,
             href: 'objectivesAndTasksForms'
             },*/

            18: {
                _id : 18,
                name: {
                    en: 'In-store Reporting',
                    ar: 'البالغات في المتاجر'
                },
                href: CONSTANTS.INSTORETASKS
            },

            /*19: {
             _id : 19,
             name: {
             en: 'Contract',
             ar: 'العقود.'
             },
             href: CONSTANTS.CONTRACTS
             },*/

            20: {
                _id : 20,
                name: {
                    en: 'Contract Yearly and Visibility',
                    ar: 'العقود السنوية والمرئية'
                },
                href: CONSTANTS.CONTRACTSYEARLY
            },

            /*21: {
             _id : 21,
             name: {
             en: 'Visibility',
             ar: ' الرؤية'
             }
             ,
             href: 'contractsVisibility'
             },*/

            22: {
                _id : 22,
                name: {
                    en: 'Contract Secondary',
                    ar: 'العقود الثانوية'
                },
                href: CONSTANTS.CONTRACTSSECONDARY
            },

            /*23: {
             _id : 23,
             name: {
             en: 'Employees Performance',
             ar: 'أداء الموظف'
             }
             ,
             href: 'employeesPerformance'
             },

             24: {
             _id : 24,
             name: {
             en: 'Custom Report',
             ar: 'قائمة التقارير'
             },
             href: CONSTANTS.CUSTOMREPORTS
             },*/

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

            /* 27: {
             _id : 27,
             name: {
             en: 'Settings',
             ar: 'الإعدادات'
             },
             href: 'settings'
             },

             28: {
             _id : 28,
             name: {
             en: 'Login Credentials',
             ar: 'بيانات تسجيل للدخول'
             }
             ,
             href: 'loginCredentials'
             },*/

            31: {
                _id : 31,
                name: {
                    en: 'Al Alali Questionnaire',
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
                    en: 'Al Alali promo evaluation',
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
                    en: 'Al Alali promotions items',
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
                    en: 'Al Alali Branding & Display report',
                    ar: 'العلامات التجارية وتقارير العرض الخاصة بالعلالي'
                },
                href: CONSTANTS.BRANDING_ACTIVITY
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
                    en: 'Al Alali Branding & Display items',
                    ar: 'العلامات التجارية وتقارير العرض للسلع'
                },
                href: CONSTANTS.BRANDING_ACTIVITY_ITEMS
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
                    ar: '' //todo ar translation
                },
                href: CONSTANTS.CONTACT_US
            },

            44: {
                _id : 44,
                name : {
                    en: 'Consumer Survey',
                    ar: '' //todo ar translation
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
            }

            /*1000: {
             _id : 1000,
             name: {
             en: 'Custom Reports',
             ar: ' التقارير المخصصة'
             }
             ,
             href: CONSTANTS.CUSTOMREPORTS
             },

             1001: {
             _id : 1001,
             name: {
             en: 'Price report',
             ar: ' تقرير الاسعار'
             }
             ,
             href: 'priceReport'
             },

             1010: {
             _id : 1010,
             name: {
             en: 'Comment',
             ar: 'التعليق'
             },
             href: CONSTANTS.COMMENT
             }*/
        };
        return MODULE_NAMES;
    }

    if (typeof exports !== 'undefined') {
        if (typeof module !== 'undefined' && module.exports) {
            var CONSTANTS = require('./contentType');
            module.exports = getConstants(CONSTANTS);
        }
    } else if (typeof define !== 'undefined' && define.amd) {
        define(['./contentType'], function (CONSTANTS) {
            return getConstants(CONSTANTS);
        });
    }
}());
