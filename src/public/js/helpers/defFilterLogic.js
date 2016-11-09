define([
    'Underscore',
    'constants/contentType',
    'constants/otherConstants'

], function (_, CONTENT_TYPES, OTHER_CONSTANTS) {
    'use strict';

    var defFilters = function (currentUserId) {
        var self = this;
        var coveredIdsArr = Object.keys(App.currentUser && App.currentUser.covered || {});

        this.getDefFilter = function (contentType, tabsName) {
            var result = self[contentType][tabsName];

            var level = App.currentUser.accessRole.level;

            var condition = level === 1
                && (contentType === CONTENT_TYPES.OBJECTIVES || contentType === CONTENT_TYPES.INSTORETASKS)
                && (tabsName === 'all' || tabsName === 'closed');

            if (condition) {
                result = self[contentType][tabsName + 'MA'];
            }

            return result;
        };

        this[CONTENT_TYPES.PRICESURVEY] = {
            all: {}
        };

        this[CONTENT_TYPES.BRANDING_ACTIVITY] = {
            all: {}
        };

        this[CONTENT_TYPES.SHELFSHARES] = {
            all: {}
        };

        this[CONTENT_TYPES.QUESTIONNARIES] = {
            all: {}
        };

        this[CONTENT_TYPES.CONSUMERS_SURVEY] = {
            all: {}
        };

        this[CONTENT_TYPES.CONTACT_US] = {
            all: {}
        };

        this[CONTENT_TYPES.COUNTRY] = {
            all     : {
                archived: {
                    type  : 'boolean',
                    values: [false]
                }
            },
            archived: {
                archived: {
                    type  : 'boolean',
                    values: [true]
                }
            }
        };

        this[CONTENT_TYPES.REGION] = {
            all     : {
                archived: {
                    type  : 'boolean',
                    values: [false]
                }
            },
            archived: {
                archived: {
                    type  : 'boolean',
                    values: [true]
                }
            }
        };

        this[CONTENT_TYPES.SUBREGION] = {
            all     : {
                archived: {
                    type  : 'boolean',
                    values: [false]
                }
            },
            archived: {
                archived: {
                    type  : 'boolean',
                    values: [true]
                }
            }
        };

        this[CONTENT_TYPES.BRANCH] = {
            all     : {
                archived: {
                    type  : 'boolean',
                    values: [false]
                }
            },
            archived: {
                archived: {
                    type  : 'boolean',
                    values: [true]
                }
            }
        };

        this[CONTENT_TYPES.DOMAIN] = {
            archive: {},
            all    : {}
        };

        this[CONTENT_TYPES.OUTLET] = {
            all     : {
                archived: {
                    type  : 'boolean',
                    values: [false]
                }
            },
            archived: {
                archived: {
                    type  : 'boolean',
                    values: [true]
                }
            }
        };

        this[CONTENT_TYPES.RETAILSEGMENT] = {
            all     : {
                archived: {
                    type  : 'boolean',
                    values: [false]
                }
            },
            archived: {
                archived: {
                    type  : 'boolean',
                    values: [true]
                }
            }
        };

        this[CONTENT_TYPES.ACTIVITYLIST] = {
            all     : {
                archived: {
                    type  : 'boolean',
                    values: [false]
                }
            },
            archived: {
                archived: {
                    type  : 'boolean',
                    values: [true]
                }
            },

            assignToACM : {
                'assignLevel': {
                    type  : 'integer',
                    values: [4]
                }
            },
            assignToElse: {
                'assignLevel': {
                    type  : 'integer',
                    values: [5, 6, 7]
                }
            }
        };

        this[CONTENT_TYPES.PERSONNEL] = {
            all     : {
                archived: {
                    type  : 'boolean',
                    values: [false]
                }
            },
            archived: {
                archived: {
                    type  : 'boolean',
                    values: [true]
                }
            },

            assignToACM : {
                'assignLevel': {
                    type  : 'integer',
                    values: [4]
                }
            },
            assignToElse: {
                'assignLevel': {
                    type  : 'integer',
                    values: [5, 6, 7]
                }
            }
        };

        this[CONTENT_TYPES.NOTIFICATIONS] = {
            all: {}
        };

        this[CONTENT_TYPES.OBJECTIVES] = {
            allMA: {
                $and: {
                    type  : 'collection',
                    values: [{
                        status: {
                            type   : 'string',
                            values : [OTHER_CONSTANTS.OBJECTIVE_STATUSES.CLOSED],
                            names  : ['Closed'],
                            options: {$nin: true}
                        },
                        $nor  : {
                            type  : 'collection',
                            values: [{
                                'createdBy.user': {
                                    type   : 'ObjectId',
                                    values : [currentUserId],
                                    options: {$nin: true}
                                },
                                status          : {
                                    type  : 'string',
                                    values: [OTHER_CONSTANTS.OBJECTIVE_STATUSES.DRAFT],
                                    names : ['Draft']
                                }
                            }]
                        }
                    }]
                }
            },

            all: {
                $and: {
                    type  : 'collection',
                    values: [{
                        status: {
                            type   : 'string',
                            values : [OTHER_CONSTANTS.OBJECTIVE_STATUSES.CLOSED],
                            names  : ['Closed'],
                            options: {$nin: true}
                        },
                        $or   : {
                            type  : 'collection',
                            values: [
                                {
                                    assignedTo: {
                                        type  : 'ObjectId',
                                        values: [currentUserId].concat(coveredIdsArr)
                                    },
                                    status    : {
                                        type   : 'string',
                                        values : [OTHER_CONSTANTS.OBJECTIVE_STATUSES.DRAFT],
                                        names  : ['Draft'],
                                        options: {$nin: true}
                                    }
                                },
                                {
                                    'createdBy.user': {
                                        type  : 'ObjectId',
                                        values: [currentUserId].concat(coveredIdsArr)
                                    }
                                }
                            ]
                        }
                    }]
                }
            },

            assignedToMe: {
                $and: {
                    type  : 'collection',
                    values: [{
                        'assignedTo': {
                            type  : 'ObjectId',
                            values: [currentUserId]
                        },
                        'status'    : {
                            type   : 'string',
                            values : [OTHER_CONSTANTS.OBJECTIVE_STATUSES.DRAFT, OTHER_CONSTANTS.OBJECTIVE_STATUSES.CLOSED],
                            names  : ['Draft', 'Closed'],
                            options: {$nin: true}
                        }
                    }]
                }
            },

            createdByMe: {
                $and: {
                    type  : 'collection',
                    values: [{
                        'createdBy.user': {
                            type  : 'ObjectId',
                            values: [currentUserId]
                        },
                        'status'        : {
                            type   : 'string',
                            values : [OTHER_CONSTANTS.OBJECTIVE_STATUSES.CLOSED],
                            names  : ['Closed'],
                            options: {$nin: true}
                        }
                    }]
                }
            },

            myCover: {
                $and : {
                    type  : 'collection',
                    values: [{
                        status: {
                            type   : 'string',
                            values : [OTHER_CONSTANTS.OBJECTIVE_STATUSES.CLOSED],
                            names  : ['Closed'],
                            options: {$nin: true}
                        },
                        $or   : {
                            type  : 'collection',
                            values: [
                                {
                                    assignedTo: {
                                        type  : 'ObjectId',
                                        values: coveredIdsArr
                                    },
                                    status    : {
                                        type   : 'string',
                                        values : [OTHER_CONSTANTS.OBJECTIVE_STATUSES.DRAFT],
                                        names  : ['Draft'],
                                        options: {$nin: true}
                                    }
                                },
                                {
                                    'createdBy.user': {
                                        type  : 'ObjectId',
                                        values: coveredIdsArr
                                    }
                                }
                            ]
                        }
                    }]
                },
                cover: true
            },

            closedMA: {
                $and: {
                    type  : 'collection',
                    values: [{
                        'status': {
                            type  : 'string',
                            values: [OTHER_CONSTANTS.OBJECTIVE_STATUSES.CLOSED],
                            names : ['Closed']
                        }
                    }]
                }
            },

            closed: {
                $and: {
                    type  : 'collection',
                    values: [{
                        '$or'   : {
                            type  : 'collection',
                            values: [
                                {
                                    'assignedTo': {
                                        type  : 'ObjectId',
                                        values: [currentUserId]
                                    }
                                },
                                {
                                    'createdBy.user': {
                                        type  : 'ObjectId',
                                        values: [currentUserId]
                                    }
                                }
                            ]
                        },
                        'status': {
                            type  : 'string',
                            values: [OTHER_CONSTANTS.OBJECTIVE_STATUSES.CLOSED],
                            names : ['Closed']
                        }
                    }]
                }
            }
        };

        this[CONTENT_TYPES.INSTORETASKS] = {
            allMA: {
                $and: {
                    type  : 'collection',
                    values: [{
                        status: {
                            type   : 'string',
                            values : [OTHER_CONSTANTS.OBJECTIVE_STATUSES.CLOSED],
                            names  : ['Closed'],
                            options: {$nin: true}
                        },
                        $nor  : {
                            type  : 'collection',
                            values: [
                                {
                                    'createdBy.user': {
                                        type   : 'ObjectId',
                                        values : [currentUserId],
                                        options: {$nin: true}
                                    },
                                    status          : {
                                        type  : 'string',
                                        values: [OTHER_CONSTANTS.OBJECTIVE_STATUSES.DRAFT],
                                        names : ['Draft']
                                    }
                                }
                            ]
                        }
                    }]
                }
            },

            all: {
                $and: {
                    type  : 'collection',
                    values: [{
                        status: {
                            type   : 'string',
                            values : [OTHER_CONSTANTS.OBJECTIVE_STATUSES.CLOSED],
                            names  : ['Closed'],
                            options: {$nin: true}
                        },
                        $or   : {
                            type  : 'collection',
                            values: [
                                {
                                    'history.assignedTo': {
                                        type  : 'ObjectId',
                                        values: [currentUserId].concat(coveredIdsArr)
                                    },
                                    status              : {
                                        type   : 'string',
                                        values : [OTHER_CONSTANTS.OBJECTIVE_STATUSES.DRAFT],
                                        names  : ['Draft'],
                                        options: {$nin: true}
                                    }
                                },
                                {
                                    assignedTo: {
                                        type  : 'ObjectId',
                                        values: [currentUserId].concat(coveredIdsArr)
                                    },
                                    status    : {
                                        type   : 'string',
                                        values : [OTHER_CONSTANTS.OBJECTIVE_STATUSES.DRAFT],
                                        names  : ['Draft'],
                                        options: {$nin: true}
                                    }
                                },
                                {
                                    'createdBy.user': {
                                        type  : 'ObjectId',
                                        values: [currentUserId].concat(coveredIdsArr)
                                    }
                                }
                            ]
                        }
                    }]
                }
            },

            assignedToMe: {
                $and: {
                    type  : 'collection',
                    values: [{
                        '$or'   : {
                            type  : 'collection',
                            values: [
                                {
                                    'history.assignedTo': {
                                        type  : 'ObjectId',
                                        values: [currentUserId]
                                    },
                                    status              : {
                                        type   : 'string',
                                        values : [OTHER_CONSTANTS.OBJECTIVE_STATUSES.DRAFT],
                                        names  : ['Draft'],
                                        options: {$nin: true}
                                    }
                                },
                                {
                                    'assignedTo': {
                                        type  : 'ObjectId',
                                        values: [currentUserId]
                                    },
                                    status      : {
                                        type   : 'string',
                                        values : [OTHER_CONSTANTS.OBJECTIVE_STATUSES.DRAFT],
                                        names  : ['Draft'],
                                        options: {$nin: true}
                                    }
                                }
                            ]
                        },
                        'status': {
                            type   : 'string',
                            values : [OTHER_CONSTANTS.OBJECTIVE_STATUSES.CLOSED],
                            names  : ['Closed'],
                            options: {$nin: true}
                        }
                    }]
                }
            },

            createdByMe: {
                $and: {
                    type  : 'collection',
                    values: [{
                        'createdBy.user': {
                            type  : 'ObjectId',
                            values: [currentUserId]
                        },
                        'status'        : {
                            type   : 'string',
                            values : [OTHER_CONSTANTS.OBJECTIVE_STATUSES.CLOSED],
                            names  : ['Closed'],
                            options: {$nin: true}
                        }
                    }]
                }
            },

            myCover: {
                $and: {
                    type  : 'collection',
                    values: [{
                        status: {
                            type   : 'string',
                            values : [OTHER_CONSTANTS.OBJECTIVE_STATUSES.CLOSED],
                            names  : ['Closed'],
                            options: {$nin: true}
                        },
                        $or   : {
                            type  : 'collection',
                            values: [
                                {
                                    assignedTo: {
                                        type  : 'ObjectId',
                                        values: coveredIdsArr
                                    },
                                    status    : {
                                        type   : 'string',
                                        values : [OTHER_CONSTANTS.OBJECTIVE_STATUSES.DRAFT],
                                        names  : ['Draft'],
                                        options: {$nin: true}
                                    }
                                },
                                {
                                    'createdBy.user': {
                                        type  : 'ObjectId',
                                        values: coveredIdsArr
                                    }
                                }
                            ]
                        }
                    }]
                }
            },

            closedMA: {
                $and: {
                    type  : 'collection',
                    values: [{
                        'status': {
                            type  : 'string',
                            values: [OTHER_CONSTANTS.OBJECTIVE_STATUSES.CLOSED],
                            names : ['Closed']
                        }
                    }]
                }
            },

            closed: {
                $and: {
                    type  : 'collection',
                    values: [{
                        '$or'   : {
                            type  : 'collection',
                            values: [
                                {
                                    'assignedTo': {
                                        type  : 'ObjectId',
                                        values: [currentUserId]
                                    }
                                },
                                {
                                    'createdBy.user': {
                                        type  : 'ObjectId',
                                        values: [currentUserId]
                                    }
                                }
                            ]
                        },
                        'status': {
                            type  : 'string',
                            values: [OTHER_CONSTANTS.OBJECTIVE_STATUSES.CLOSED],
                            names : ['Closed']
                        }
                    }]
                }
            }
        };

        this[CONTENT_TYPES.ITEMSPRICES] = {
            all     : {
                archived: {
                    type  : 'boolean',
                    values: [false]
                }
            },
            archived: {
                archived: {
                    type  : 'boolean',
                    values: [true]
                }
            }
        };

        this[CONTENT_TYPES.PLANOGRAM] = {
            all     : {
                archived: {
                    type  : 'boolean',
                    values: [false]
                }
            },
            archived: {
                archived: {
                    type  : 'boolean',
                    values: [true]
                }
            }
        };

        this[CONTENT_TYPES.COMPETITORSLIST] = {
            all     : {
                archived: {
                    type  : 'boolean',
                    values: [false]
                }
            },
            archived: {
                archived: {
                    type  : 'boolean',
                    values: [true]
                }
            }
        };

        this[CONTENT_TYPES.COMPETITORBRANDING] = {
            all: {
                archived: {
                    type  : 'boolean',
                    values: [false]
                }
            }
        };

        this[CONTENT_TYPES.COMPETITORPROMOTION] = {
            all: {
                archived: {
                    type  : 'boolean',
                    values: [false]
                }
            }
        };

        this[CONTENT_TYPES.ACHIEVEMENTFORM] = {
            all: {
                archived: {
                    type  : 'boolean',
                    values: [false]
                }
            }
        };

        this[CONTENT_TYPES.NEWPRODUCTLAUNCH] = {
            all: {
                archived: {
                    type  : 'boolean',
                    values: [false]
                }
            }
        };

        this[CONTENT_TYPES.PROMOTIONS] = {
            all: {}
        };

        this[CONTENT_TYPES.CONTRACTSYEARLY] = {
            all: {}
        };

        this[CONTENT_TYPES.CONTRACTSSECONDARY] = {
            all: {}
        };

        this[CONTENT_TYPES.DOCUMENTS] = {
            all     : {
                archived: {
                    type  : 'boolean',
                    values: [false]
                }
            },
            archived: {
                archived: {
                    type  : 'boolean',
                    values: [true]
                }
            }
        };

        this[CONTENT_TYPES.NOTES] = {
            all     : {
                archived: {
                    type  : 'boolean',
                    values: [false]
                }
            },
            archived: {
                archived: {
                    type  : 'boolean',
                    values: [true]
                }
            }
        };
    };

    return defFilters;
});
