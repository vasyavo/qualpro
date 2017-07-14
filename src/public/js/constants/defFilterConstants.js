var CONTENT_TYPES = require('./contentType');
var OTHER_CONSTANTS = require('../constants/otherConstants');

var defFilters = {};

defFilters[CONTENT_TYPES.PERSONNEL] = {
    all: {
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

defFilters[CONTENT_TYPES.OBJECTIVES] = {
    all: {
        archived: false,
        status  : {
            type   : 'string',
            values : [OTHER_CONSTANTS.OBJECTIVE_STATUSES.CLOSED],
            names  : ['Closed'],
            options: {$nin: true}
        }
    },

    assignedToMe: {
        'assignedTo': {
            type  : 'ObjectId',
            values: [App.currentUser._id]
        },

        'status': {
            type   : 'string',
            values : [OTHER_CONSTANTS.OBJECTIVE_STATUSES.CLOSED],
            names  : ['Closed'],
            options: {$nin: true}
        }
    },

    createdByMe: {
        'createdBy.user': {
            type  : 'ObjectId',
            values: [App.currentUser._id]
        },

        'status'        : {
            type   : 'string',
            values : [OTHER_CONSTANTS.OBJECTIVE_STATUSES.CLOSED],
            names  : ['Closed'],
            options: {$nin: true}
        }
    },

    myCover: {
        cover: {
            type  : 'ObjectId',
            values: [App.currentUser._id]
        },

        status: {
            type   : 'string',
            values : [OTHER_CONSTANTS.OBJECTIVE_STATUSES.CLOSED],
            names  : ['Closed'],
            options: {$nin: true}
        }
    },

    closed: {
        '$or'   : {
            type  : 'collection',
            values: [
                {
                    'assignedTo': {
                        type  : 'ObjectId',
                        values: [App.currentUser._id]
                    }
                },
                {
                    'createdBy.user': {
                        type  : 'ObjectId',
                        values: [App.currentUser._id]
                    }
                }
            ]
        },

        'status': {
            type  : 'string',
            values: [OTHER_CONSTANTS.OBJECTIVE_STATUSES.CLOSED],
            names : ['Closed']
        }
    }
};

module.exports = defFilters;
