var _ = require('underscore');
var Backbone = require('backbone');
var FilterModel = require('../../models/filterModel');

module.exports = Backbone.Collection.extend({
    model: FilterModel,

    comparator: function (filterModel) {
        var jsonModel = filterModel.toJSON();

        if (jsonModel.sortKey) {
            return jsonModel.sortKey;
        }

        return jsonModel.name;
    },

    unselectAll: function () {
        this.models.forEach(function (model) {
            model.set({status: false});
        });
    },

    getSelected: function (options) {
        var collection = this.toJSON();
        var selected = _.filter(collection, function (model) {
            return model.status;
        });

        options = options || {};

        if (options.ids) {
            return selected.length ? _.pluck(selected, '_id') : null;
        }

        if (options.names) {
            return selected.length ? _.pluck(selected, 'name') : null;
        }

        return selected || null;
    },

    getDividedCollections: function () {
        var collection = this.toJSON();
        var checkedModels = [];
        var uncheckedModels = [];
        var result;
        _.map(collection, function (model) {
            if (model.status) {
                return checkedModels.push(model);
            }
            return uncheckedModels.push(model);
        });
        return result = {
            checked  : checkedModels,
            unchecked: uncheckedModels
        };
    },

    filterById: function (oIds) {
        var filtered = this.filter(function (model) {
            return oIds.indexOf(model.get('_id')) !== -1;
        });

        var ids = filtered.map(function (model) {
            return model.get('parent');
        });

        return {models: filtered, ids: ids};
    },

    initialize: function () {}
});
