var $ = require('jquery');
var Parent = require('../parrent');
var ObjectivesModel = require('../../models/objectives');
var InStoreModel = require('../../models/inStoreTasks');
var CONTENT_TYPES = require('../../constants/contentType');
var OTHER_CONSTANTS = require('../../constants/otherConstants');
var custom = require('../../custom');

function buildModelsObject() {
    var resObject = {};

    resObject[CONTENT_TYPES.OBJECTIVES] = ObjectivesModel;
    resObject[CONTENT_TYPES.INSTORETASKS] = InStoreModel;

    return resObject;
}

var models = buildModelsObject();

module.exports = Parent.extend({
    url        : 'personnel/personnelTasks',
    viewType   : null,
    contentType: null,

    modelId: function (attributes) {
        return attributes._id;
    },

    model: function (attributes, options) {
        options.parse = true;

        return new models[attributes.context || 'objectives'](attributes, options);
    },

    initialize: function (options) {
        var page;

        options = options || {};
        page = options.page;
        options.reset = true;

        if (options.url) {
            this.url = options.url;

            delete options.url;
        }

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
            $or: {
                type  : 'collection',
                values: [
                    {assignedTo: filterId},
                    {'createdBy.user': filterId}
                ]
            },

            status: {
                type   : 'string',
                values : [OBJECTIVE_STATUSES.CLOSED],
                options: {$nin: true}
            }
        };

        options.filter = filter;
    }
});
