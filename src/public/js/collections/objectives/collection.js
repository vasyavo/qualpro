var $ = require('jquery');
var _ = require('underscore');
var async = require('async');
var Parent = require('../parrent');
var Model = require('../../models/objectives');
var CONTENT_TYPES = require('../../constants/contentType');
var custom = require('../../custom');
var App = require('../../appState');

module.exports = Parent.extend({
    model      : Model,
    url        : CONTENT_TYPES.OBJECTIVES,
    viewType   : null,
    contentType: null,

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

    composeFlowTree: function (taskLevel, callback) {
        var result = this.toJSON();
        var ids = {};
        var level = {};
        var levels;
        var index;
        var parentNew;

        levels = _.pluck(result, '_id');

        if (result.length) {
            for (var i = 4; i > 0; i--) {
                index = levels.indexOf(i);

                if (index !== -1) {
                    level[i] = result[index].subTasks;
                } else {
                    level[i] = [];
                }
            }
        }

        ids[1] = _.map(_.pluck(level[1], '_id'), function (id) {
            return id.toString()
        });
        ids[2] = _.map(_.pluck(level[2], '_id'), function (id) {
            return id.toString()
        });
        ids[3] = _.map(_.pluck(level[3], '_id'), function (id) {
            return id.toString()
        });

        function getParallelTask(curLevel) {
            return function (parallelCb) {
                var idIndex;
                var model;

                if (!level[curLevel].length) {
                    return parallelCb(null);
                }

                for (var i = level[curLevel].length - 1; i >= 0; i--) {
                    model = level[curLevel][i];
                    model.dateStart = custom.dateFormater('DD.MM.YYYY', model.dateStart);
                    model.dateEnd = custom.dateFormater('DD.MM.YYYY', model.dateEnd);

                    _.map(OTHER_CONSTANTS.OBJECTIVESTATUSES_FOR_UI, function (status) {
                        if (status._id === model.status) {
                            model.status = status;
                        }
                    });

                    if (curLevel !== 1) {
                        parentNew = model.parentNew || '';
                        idIndex = ids[curLevel - 1].indexOf(parentNew.toString());

                        if (idIndex !== -1) {
                            level[curLevel - 1][idIndex].child.push(model);
                        }
                    }
                }

                parallelCb(null);
            };
        }

        function getParallelTasksArray() {
            var parallelTasks = [];

            for (var i = 4; i >= 1; i--) {
                parallelTasks.push(getParallelTask(i));
            }

            return parallelTasks;
        }

        async.parallel(getParallelTasksArray(), function (err) {
            if (err) {
                return callback(err);
            }

            callback(null, level[taskLevel]);
        });
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
