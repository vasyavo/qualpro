var _ = require('underscore');
var Parent = require('../parrent');
var Model = require('../../models/origin');
var CONTENT_TYPES = require('../../constants/contentType');
var custom = require('../../custom');

module.exports = Parent.extend({
    model      : Model,
    url        : CONTENT_TYPES.ORIGIN,
    viewType   : null,
    contentType: CONTENT_TYPES.ORIGIN,

    initialize: function (options) {
        var page;

        options = options || {};
        page = options.page;
        options.reset = true;

        this.getPage(page, options);
    },

    getSelected: function (options) {
        var selectedModels = this.where({selected: true});
        var jsonModels;

        options = options || [];
        jsonModels = _.invoke(selectedModels, 'toJSON');

        if (options.json) {
            return jsonModels
        }

        if (options.names) {
            return _.pluck(jsonModels, 'name');
        }

        if (options.ids) {
            return _.pluck(jsonModels, '_id');
        }

        return selectedModels;
    }
});
