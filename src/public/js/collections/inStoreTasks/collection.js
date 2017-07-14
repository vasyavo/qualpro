var $ = require('jquery');
var _ = require('underscore');
var Parent = require('../parrent');
var Model = require('../../models/inStoreTasks');
var CONTENT_TYPES = require('../../constants/contentType');
var OTHER_CONSTANTS = require('../../constants/otherConstants');
var App = require('../../appState');

module.exports = Parent.extend({
    model      : Model,
    url        : CONTENT_TYPES.INSTORETASKS,
    viewType   : null,
    contentType: null,

    initialize: function (options) {
        var page;

        options = options || {};
        page = options.page;
        options.reset = true;

        if ($.isEmptyObject(options.filter)) {
            this.filterInitialize(options);
        }

        this.getPage(page, options);
    },

    filterInitialize: function (options) {
        var OBJECTIVE_STATUSES = OTHER_CONSTANTS.OBJECTIVE_STATUSES;

        var id = App.currentUser._id;
        var filterId = {
            type  : 'ObjectId',
            values: [id]
        };

        var filter = {
            '$or'   : {
                type  : 'collection',
                values: [
                    {'assignedTo': filterId},
                    {'createdBy.user': filterId}
                ]
            },
            'status': {
                type   : 'string',
                values : [OBJECTIVE_STATUSES.CLOSED],
                options: {$nin: true}
            }
        };

        options.filter = filter;
    }
});
