(function () {
    var root;

    var CONSTANTS = {
        CANVAS_SIZE     : 135,
        DEFAULT_PER_PAGE: 25,

        DISPLAY_TYPE_DD: {
            en : [
                {_id: 'floorDisplayId', name: 'Floor Display', sortKey: 0},
                {_id: 'gondolaId', name: 'Gondola', sortKey: 1},
                {_id: 'thematicStandId', name: 'Thematic Stand', sortKey: 2},
                {_id: 'shelfId', name: 'Shelf', sortKey: 3},
                {_id: 'otherId', name: 'Other', sortKey: 4}
            ],
            ar : [
                {_id: 'floorDisplayId', name: 'ساحة عرض أرضية', sortKey: 0},
                {_id: 'gondolaId', name: 'جندولة', sortKey: 1},
                {_id: 'thematicStandId', name:  'استاند خاص بحملة ترويج معينة', sortKey: 2},
                {_id: 'shelfId', name: 'رف', sortKey: 3},
                {_id: 'otherId', name: 'آخر', sortKey: 4}
            ]
        },

        DISPLAY_TYPE: {
            GONDOLA   : 'gondola',
            FLOORSTAND: 'floorStand',
            METALSTAND: 'metalStand'
        },

        OBJECTIVES_TYPE: [
            {
                _id    : 'weekly',
                name   : {
                    en: 'Weekly Company Objective',
                    ar: 'هدف الشركة الاسبوعى'
                },
                sortKey: 0
            },
            {
                _id    : 'monthly',
                name   : {
                    en: 'Monthly Company Objective',
                    ar: 'هدف الشركة الشهرى'
                },
                sortKey: 1
            },
            {
                _id    : 'quarterly',
                name   : {
                    en: 'Quarterly Company Objective',
                    ar: ' هدف الشركة الربع سنوية'
                },
                sortKey: 2
            },
            {
                _id    : 'yearly',
                name   : {
                    en: 'Yearly Company Objective',
                    ar: ' هدف الشركة السنوي'
                },
                sortKey: 3
            },
            {
                _id    : 'individual',
                name   : {
                    en: 'Individual Objective',
                    ar: 'هدف فردى'
                },
                sortKey: 4
            },
            {
                _id    : 'country',
                name   : {
                    en: 'Country Objective',
                    ar: 'هدف فردى'
                },
                sortKey: 5
            }
        ],

        QUESTION_TYPE: [
            {
                _id : 'singleChoice',
                name: {
                    en: 'Single Choice',
                    ar: ' اختيار واحد '
                },

                sortKey: 0
            },

            {
                _id : 'multiChoice',
                name: {
                    en: 'Multi Choice',
                    ar: ' اختيارات متعددة '
                },

                sortKey: 1
            },

            {
                _id : 'fullAnswer',
                name: {
                    en: 'Full Answer',
                    ar: 'إجابة كاملة '
                },

                sortKey: 2
            }
        ],

        CONSUMER_SURVEY_QUESTION_TYPE : [
            {
                _id : 'singleChoice',
                name: {
                    en: 'Single Choice',
                    ar: ' اختيار واحد '
                },

                sortKey: 0
            },

            {
                _id : 'multiChoice',
                name: {
                    en: 'Multi Choice',
                    ar: ' اختيارات متعددة '
                },

                sortKey: 1
            },

            {
                _id : 'fullAnswer',
                name: {
                    en: 'Full Answer',
                    ar: 'إجابة كاملة '
                },

                sortKey: 2
            },

            {
                _id : 'NPS',
                name: {
                    en: 'NPS',
                    ar: '' //todo translation
                },

                sortKey: 0
            }
        ],

        CONTRACTS_TYPE: [
            {
                _id : 'yearly',
                name: {
                    en: 'Yearly',
                    ar: 'Ar Yearly' //todo translation
                },

                sortKey: 0
            },
            {
                _id : 'visibility',
                name: {
                    en: 'Visibility',
                    ar: 'Ar Visibility' //todo translation
                },

                sortKey: 1
            }
        ],

        CONTRACTS_SECONDARY_TYPE: [
            {
                _id : 'monthlyDisplay',
                name: {
                    en: 'Monthly Display',
                    ar: 'Ar Monthly Display'
                },

                sortKey: 0
            },
            {
                _id : 'activityDisplay',
                name: {
                    en: 'Activity Display',
                    ar: 'Ar Activity Display'
                },

                sortKey: 1
            }
        ],

        CONTRACTS_UI_STATUSES: [
            {
                _id : 'draft',
                name: {
                    en: 'Draft',
                    ar: 'مسودة'
                },

                sortKey: 0
            },
            {
                _id : 'active',
                name: {
                    en: 'Active',
                    ar: 'فعال'
                },

                sortKey: 1
            },
            {
                _id : 'expired',
                name: {
                    en: 'Expired',
                    ar: 'منتهى الصلاحية '
                },

                sortKey: 2
            },
            {
                _id : 'completed',
                name: {
                    en: 'Completed',
                    ar: 'منجز'
                },

                sortKey: 3
            }
        ],

        OBJECTIVES_PRIORITY: [
            {
                _id : 'low',
                name: {
                    en: 'Low',
                    ar: 'منخفض'
                },

                sortKey: 0
            },
            {
                _id : 'medium',
                name: {
                    en: 'Medium',
                    ar: 'متوسط'
                },

                sortKey: 1
            },
            {
                _id : 'high',
                name: {
                    en: 'High',
                    ar: 'عالي'
                },

                sortKey: 2
            },
            {
                _id : 'urgent',
                name: {
                    en: 'Urgent',
                    ar: 'العاجلة'
                },

                sortKey: 3
            }
        ],

        OBJECTIVES_UI_STATUSES: [
            {_id: 'draft', name: 'Draft', sortKey: 0},
            {_id: 'inProgress', name: 'In progress', sortKey: 1},
            {_id: 'overDue', name: 'Over due', sortKey: 2},
            {_id: 'toBeDiscussed', name: 'To be discussed', sortKey: 3},
            {_id: 'fail', name: 'Fail', sortKey: 4},
            {_id: 'completed', name: 'Completed', sortKey: 5},
            {_id: 'closed', name: 'Closed', sortKey: 6},
            {_id: 'reOpened', name: 'Re-opened', sortKey: 7}
        ],

        OBJECTIVES_FORMS: [
            {
                _id : 'distribution',
                name: {
                    en: 'Distribution Form',
                    ar: 'نموذج التوزيع'
                },

                sortKey: 0
            },
            {
                _id : 'visibility',
                name: {
                    en: 'Visibility Form',
                    ar: 'نموذج الرؤية'
                },

                sortKey: 1
            }
        ],

        OBJECTIVE_STATUSES: {
            DRAFT          : 'draft',
            IN_PROGRESS    : 'inProgress',
            OVER_DUE       : 'overDue',
            TO_BE_DISCUSSED: 'toBeDiscussed',
            FAIL           : 'fail',
            COMPLETED      : 'completed',
            CLOSED         : 'closed',
            RE_OPENED      : 'reOpened'
        },

        PROMOTION_UI_STATUSES: [
            {
                _id : 'draft',
                name: {
                    en: 'Draft',
                    ar: 'مسودة'
                },

                sortKey: 0
            },
            {
                _id : 'active',
                name: {
                    en: 'Active',
                    ar: 'فعال'
                },

                sortKey: 1
            },
            {
                _id : 'expired',
                name: {
                    en: 'Expired',
                    ar: 'منتهى الصلاحية '
                },

                sortKey: 2
            }
        ],

        PROMOTION_STATUSES: {
            DRAFT  : 'draft',
            ACTIVE : 'active',
            EXPIRED: 'expired'
        },

        PROMOTION_UI_DISPLAYTYPE: [
            {_id: 'a', name: 'Gondola', sortKey: 0},
            {_id: 'b', name: 'Medal stand', sortKey: 1},
            {_id: 'c', name: 'Plastic stand', sortKey: 2}
        ],

        PROMOTION_DISPLAYTYPE: {
            A: 'a',
            B: 'b',
            C: 'c'
        },

        RATING_MONTHLY_DD: [
            {
                _id : 3,
                name: {
                    en: 'Last 3 Month',
                    ar: ' الأشهر الثلاثة الماضية '
                }
            },
            {
                _id : 6,
                name: {
                    en: 'Last 6 Month',
                    ar: ' الأشهر الستة الماضية'
                }
            },
            {
                _id : 12,
                name: {
                    en: 'Last 12 Month',
                    ar: ' الاثني عشر شهرا الماضية'
                }
            }
        ],

        RATING_MONTHLY_REPORTS_TYPES: [
            {
                _id : 'promotionsItems',
                name: {
                    en: 'Al Alali promo evaluation',
                    ar: 'تقييم ترويج العلالي'
                }
            },
            {
                _id : 'competitorPromotion',
                name: {
                    en: 'Competitor promotion activities',
                    ar: 'أنشطة ترويج المنافسين'
                }
            },
            {
                _id : 'competitorBranding',
                name: {
                    en: 'Competitor branding & display report',
                    ar: 'العلامات التجارية وتقارير العرض للمنافسين'
                }
            },
            {
                _id : 'achievementForm',
                name: {
                    en: 'Achievement form',
                    ar: 'استمارة الانجازات'
                }
            },
            {
                _id : 'newProductLaunch',
                name: {
                    en: 'New product launch',
                    ar: 'إطلاق منتج جديد'
                }
            }
        ],

        RATING_BIYEARLY_DD: [
            {
                _id : 2,
                name: {
                    en: 'Last Year',
                    ar: 'السنة الماضية'
                }
            },
            {
                _id : 4,
                name: {
                    en: 'Last 2 Years',
                    ar: ' خلال العامين الماضيين'
                }
            },
            {
                _id : 6,
                name: {
                    en: 'Last 3 Years',
                    ar: ' السنوات الثلاث الماضية'
                }
            }
        ],

        RATING_BIYEARLY: [
            {
                _id : 1,
                name: {
                    en: 'New',
                    ar: 'جديد'
                }
            },
            {
                _id : 2,
                name: {
                    en: 'Below Standard',
                    ar: 'دون المستوى المطلوب'
                }
            },
            {
                _id : 3,
                name: {
                    en: 'Standard',
                    ar: ' المستوى المطلوب '
                }
            },
            {
                _id : 4,
                name: {
                    en: 'Superior',
                    ar: 'متفوق'
                }
            },
            {
                _id : 5,
                name: {
                    en: 'Exceptional',
                    ar: ' استثنائي '
                }
            }
        ],

        IMAGE_CONTENT_TYPES   : ['image/jpeg', 'image/png'],
        VIDEO_CONTENT_TYPES   : ['video/mpeg', 'video/mp4', 'video/x-msvideo', 'video/x-sgi-movie', 'audio/mpeg', 'audio/mp4'],
        MS_WORD_CONTENT_TYPES : ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/vnd.ms-powerpoint', 'application/vnd.ms-excel' /*, 'application/octet-stream'*/ /*'application/vnd.openxmlformats-officedocument.wordprocessingml.template',*/ /*'application/vnd.ms-word.document.macroEnabled.12'*/],
        MS_EXCEL_CONTENT_TYPES: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', /* 'application/vnd.openxmlformats-officedocument.spreadsheetml.template', 'application/vnd.ms-excel.sheet.macroEnabled.12', 'application/vnd.ms-excel.template.macroEnabled.12', 'application/vnd.ms-excel.addin.macroEnabled.12', 'application/vnd.ms-excel.sheet.binary.macroEnabled.12'*/],
        OTHER_FORMATS         : ['application/pdf', 'application/mp4']
    };

    var objectiveStatuses = {
        draft: {
            _id : CONSTANTS.OBJECTIVE_STATUSES.DRAFT,
            name: {
                en: 'Draft',
                ar: 'مسودة'
            }
        },

        inProgress: {
            _id : CONSTANTS.OBJECTIVE_STATUSES.IN_PROGRESS,
            name: {
                en: 'In Progress',
                ar: 'فى تقدم'
            }
        },

        overDue: {
            _id : CONSTANTS.OBJECTIVE_STATUSES.OVER_DUE,
            name: {
                en: 'Over due',
                ar: ' متأخر '
            }
        },

        toBeDiscussed: {
            _id : CONSTANTS.OBJECTIVE_STATUSES.TO_BE_DISCUSSED,
            name: {
                en: 'To be discussed',
                ar: ' للنقاش'
            }
        },

        fail: {
            _id : CONSTANTS.OBJECTIVE_STATUSES.FAIL,
            name: {
                en: 'Fail',
                ar: ' إخفاق'
            }
        },

        completed: {
            _id : CONSTANTS.OBJECTIVE_STATUSES.COMPLETED,
            name: {
                en: 'Completed',
                ar: 'منجز'
            }
        },

        closed: {
            _id : CONSTANTS.OBJECTIVE_STATUSES.CLOSED,
            name: {
                en: 'Closed',
                ar: 'مغلق'
            }
        },

        reOpened: {
            _id : CONSTANTS.OBJECTIVE_STATUSES.RE_OPENED,
            name: {
                en: 'Re-opened',
                ar: 'إعادة فتح'
            }
        }
    };
    CONSTANTS.OBJECTIVESTATUSES_FOR_UI = objectiveStatuses;

    var draft = objectiveStatuses.draft;
    var inProgress = objectiveStatuses.inProgress;
    var toBeDiscussed = objectiveStatuses.toBeDiscussed;
    var completed = objectiveStatuses.completed;
    var fail = objectiveStatuses.fail;
    var overDue = objectiveStatuses.overDue;
    var closed = objectiveStatuses.closed;
    var reOpened = objectiveStatuses.reOpened;

    CONSTANTS.OBJECTIVE_STATUSES_FLOW = {
        draft: [
            draft,
            inProgress
        ],

        inProgress: [
            inProgress,
            toBeDiscussed,
            completed
        ],

        overDue: [
            overDue,
            fail,
            toBeDiscussed
        ],

        toBeDiscussed: [
            toBeDiscussed,
            completed,
            fail
        ],

        fail: [
            fail,
            completed,
            closed
        ],

        completed: [
            completed,
            closed,
            reOpened
        ],

        closed: [
            closed
        ],

        reOpened: [
            reOpened,
            completed,
            toBeDiscussed
        ]
    };

    var objectiveStatusChildrens = {
        draft        : [objectiveStatuses.draft, objectiveStatuses.inProgress],
        inProgress   : [objectiveStatuses.inProgress, objectiveStatuses.completed, objectiveStatuses.toBeDiscussed, objectiveStatuses.fail/*, objectiveStatuses.overDue*/],
        overDue      : [objectiveStatuses.overDue, objectiveStatuses.completed, objectiveStatuses.toBeDiscussed],
        toBeDiscussed: [objectiveStatuses.toBeDiscussed, objectiveStatuses.completed, objectiveStatuses.fail/*, objectiveStatuses.overDue*/],
        fail         : [objectiveStatuses.fail, objectiveStatuses.completed, objectiveStatuses.closed],
        completed    : [objectiveStatuses.completed, objectiveStatuses.closed, objectiveStatuses.reOpened],
        closed       : [objectiveStatuses.closed, objectiveStatuses.reOpened],
        reOpened     : [objectiveStatuses.reOpened, objectiveStatuses.completed, objectiveStatuses.toBeDiscussed/*, objectiveStatuses.overDue*/],
    };

    CONSTANTS.OBJECTIVES_STATUSES_FORDD = {
        preview: {
            1: objectiveStatusChildrens,
            2: objectiveStatusChildrens,
            3: objectiveStatusChildrens,
            4: objectiveStatusChildrens
        }
    };

    CONSTANTS.ACTIVITY_TYPES = {
        UPDATED: {
            _id : 'Updated',
            name: {
                en: 'Updated',
                ar: 'محدث '
            }
        },

        ARCHIVED: {
            _id : 'Archived',
            name: {
                en: 'Archived',
                ar: 'في الارشيف'
            }
        },

        UNARCHIVED: {
            _id : 'Unarchived',
            name: {
                en: 'Unarchived',
                ar: ' تم إلغاء ألارشفة'
            }
        },

        CREATED: {
            _id : 'Created',
            name: {
                en: 'Created',
                ar: ' تم إنشاء'
            }
        },

        COMMENTED: {
            _id : 'New comment was added',
            name: {
                en: 'New comment was added',
                ar: ' تمت إضافة تعليق جديد'
            }
        },

        COMPETITOR_VARIANT: {
            _id : 'competitorVariant',
            name: {
                en: 'Competitor Variant',
                ar: 'منوع المنافس'
            }
        }
    };

    if (typeof window === 'object' && this === window) {
        root = window;
    }
    else if (typeof global === 'object' && this === global) {
        root = global;
    }
    else {
        root = this;
    }

    if (typeof exports !== 'undefined') {
        if (typeof module !== 'undefined' && module.exports) {
            module.exports = CONSTANTS;
        }
    } else if (typeof define !== 'undefined' && define.amd) {
        define([], function () {
            return CONSTANTS;
        });
    } else {
        root.CONSTANTS = CONSTANTS;
    }

})();